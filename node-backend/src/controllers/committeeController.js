import pool from '../config/db.js';
import {
  calculatePreviewRows,
  generateSchedules,
  syncMemberPayments,
  recalculateSchedules
} from '../services/formula.js';

export async function getCommitteesDashboard(req, res) {
  try {
    const [committees] = await pool.query(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM committee_schedules cs WHERE cs.committee_id = c.id) as schedules_count,
        (SELECT COUNT(*) FROM committee_member cm WHERE cm.committee_id = c.id) as members_count,
        (SELECT SUM(cm.seats) FROM committee_member cm WHERE cm.committee_id = c.id) as total_seats_assigned
      FROM committees c
      ORDER BY c.created_at DESC
    `);

    const [members] = await pool.query('SELECT id, name, phone FROM members ORDER BY name ASC');

    const totalCommittees = committees.length;
    const activeCommittees = committees.filter(c => c.status === 'active').length;
    const totalPoolValue = committees.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0);
    const totalMembers = members.length;

    return res.json({
      success: true,
      stats: {
        total_committees: totalCommittees,
        active_committees: activeCommittees,
        total_pool_value: totalPoolValue,
        total_members: totalMembers
      },
      committees,
      members
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export function previewCalculation(req, res) {
  try {
    const { total_amount, total_members, deduction_rate, special_month_index, start_date } = req.body;
    const result = calculatePreviewRows(
      total_amount || 200000,
      total_members || 20,
      deduction_rate || 1.5,
      special_month_index,
      start_date || new Date().toISOString().split('T')[0]
    );

    if (result.error) {
      return res.status(422).json({ success: false, error: result.error });
    }

    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createCommittee(req, res) {
  const conn = await pool.getConnection();
  try {
    const {
      name,
      total_amount,
      total_members,
      deduction_rate,
      special_month_index,
      start_date,
      members, // array of member IDs
      seats    // object { memberId: count }
    } = req.body;

    if (!name || !total_amount || !total_members || !start_date) {
      return res.status(422).json({ success: false, message: 'All required committee fields must be provided' });
    }

    await conn.beginTransaction();

    const [commResult] = await conn.query(`
      INSERT INTO committees 
      (name, total_amount, total_members, deduction_rate, special_month_index, start_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
    `, [
      name.trim(),
      parseFloat(total_amount),
      parseInt(total_members, 10),
      parseFloat(deduction_rate || 0),
      parseInt(special_month_index, 10),
      start_date
    ]);

    const committeeId = commResult.insertId;
    const maxMembers = parseInt(total_members, 10);
    const memberIds = Array.isArray(members) ? members : [];
    const seatsMap = seats || {};

    if (memberIds.length > 0) {
      let totalSeats = 0;
      const pivotValues = [];
      const now = new Date();

      for (const mId of memberIds) {
        const seatCount = Math.max(1, parseInt(seatsMap[mId] || 1, 10));
        if (totalSeats + seatCount <= maxMembers) {
          pivotValues.push([committeeId, mId, seatCount, now, now]);
          totalSeats += seatCount;
        }
      }

      if (pivotValues.length > 0) {
        await conn.query(`
          INSERT INTO committee_member (committee_id, member_id, seats, created_at, updated_at)
          VALUES ?
        `, [pivotValues]);
      }
    }

    // Generate schedule entries
    await generateSchedules(committeeId, conn);

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: 'Committee created successfully with calculated schedule!',
      committee_id: committeeId
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
}

export async function getCommitteeDetail(req, res) {
  try {
    const { id } = req.params;

    const [committees] = await pool.query('SELECT * FROM committees WHERE id = ?', [id]);
    if (committees.length === 0) {
      return res.status(404).json({ success: false, message: 'Committee not found' });
    }
    const committee = committees[0];

    // Schedules with winner name and bids
    const [schedules] = await pool.query(`
      SELECT 
        cs.*,
        m.name as winner_name,
        m.phone as winner_phone
      FROM committee_schedules cs
      LEFT JOIN members m ON cs.member_id = m.id
      WHERE cs.committee_id = ?
      ORDER BY cs.month_no ASC
    `, [id]);

    // Attached members with seats
    const [committeeMembers] = await pool.query(`
      SELECT 
        m.id, 
        m.name, 
        m.phone, 
        cm.seats,
        (SELECT COUNT(*) FROM committee_schedules s WHERE s.committee_id = ? AND s.member_id = m.id) as won_count
      FROM members m
      INNER JOIN committee_member cm ON m.id = cm.member_id
      WHERE cm.committee_id = ?
      ORDER BY m.name ASC
    `, [id, id]);

    // All registered members for dropdown selection
    const [allMembers] = await pool.query('SELECT id, name, phone FROM members ORDER BY name ASC');

    // Aggregate payment stats per schedule
    const [paymentStatsRows] = await pool.query(`
      SELECT 
        schedule_id, 
        count(*) as total, 
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_count, 
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_count
      FROM committee_member_payments
      WHERE schedule_id IN (SELECT id FROM committee_schedules WHERE committee_id = ?)
      GROUP BY schedule_id
    `, [id]);

    const paymentStats = {};
    for (const p of paymentStatsRows) {
      paymentStats[p.schedule_id] = {
        total: parseInt(p.total, 10),
        paid_count: parseInt(p.paid_count || 0, 10),
        pending_count: parseInt(p.pending_count || 0, 10)
      };
    }

    // Load member bids grouped by schedule
    const [bids] = await pool.query(`
      SELECT 
        mb.*,
        m.name as member_name,
        m.phone as member_phone
      FROM member_bids mb
      INNER JOIN members m ON mb.member_id = m.id
      WHERE mb.schedule_id IN (SELECT id FROM committee_schedules WHERE committee_id = ?)
      ORDER BY mb.bid_amount DESC
    `, [id]);

    const bidsBySchedule = {};
    for (const b of bids) {
      if (!bidsBySchedule[b.schedule_id]) {
        bidsBySchedule[b.schedule_id] = [];
      }
      bidsBySchedule[b.schedule_id].push(b);
    }

    // Attach bids and formula deduction to schedules
    const v = parseFloat(committee.total_amount);
    const r = parseFloat(committee.deduction_rate);
    const baseUnit = (v * r) / 100;
    const specialIndex = parseInt(committee.special_month_index, 10);

    const enhancedSchedules = schedules.map(s => {
      const formulaDeduction = (s.index_n === specialIndex) ? 0.0 : (s.index_n * baseUnit);
      return {
        ...s,
        formula_deduction: formulaDeduction,
        bids: bidsBySchedule[s.id] || [],
        payment_stats: paymentStats[s.id] || { total: 0, paid_count: 0, pending_count: 0 }
      };
    });

    const grandTotalDeductions = enhancedSchedules.reduce((acc, s) => acc + parseFloat(s.deduction_amount || 0), 0);
    const grandTotalNetPayout = enhancedSchedules.reduce((acc, s) => acc + parseFloat(s.net_payout || 0), 0);
    const grandTotalKistPerMember = enhancedSchedules.reduce((acc, s) => acc + parseFloat(s.installment_per_member || 0), 0);

    return res.json({
      success: true,
      committee,
      schedules: enhancedSchedules,
      members: committeeMembers,
      allMembers,
      totals: {
        grand_total_deductions: parseFloat(grandTotalDeductions.toFixed(2)),
        grand_total_net_payout: parseFloat(grandTotalNetPayout.toFixed(2)),
        grand_total_kist_per_member: parseFloat(grandTotalKistPerMember.toFixed(2))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateCommittee(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      name,
      total_amount,
      total_members,
      deduction_rate,
      special_month_index,
      start_date,
      status,
      members,
      seats
    } = req.body;

    const [existing] = await conn.query('SELECT * FROM committees WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Committee not found' });
    }

    if (existing[0].status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed and cannot be modified.' });
    }

    await conn.beginTransaction();

    await conn.query(`
      UPDATE committees 
      SET name = ?, total_amount = ?, total_members = ?, deduction_rate = ?, special_month_index = ?, start_date = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      name.trim(),
      parseFloat(total_amount),
      parseInt(total_members, 10),
      parseFloat(deduction_rate),
      parseInt(special_month_index, 10),
      start_date,
      status || 'active',
      id
    ]);

    // If member list was sent
    if (Array.isArray(members)) {
      const maxMembers = parseInt(total_members, 10);
      const seatsMap = seats || {};
      let totalSeats = 0;
      const pivotValues = [];
      const now = new Date();

      await conn.query('DELETE FROM committee_member WHERE committee_id = ?', [id]);

      for (const mId of members) {
        const seatCount = Math.max(1, parseInt(seatsMap[mId] || 1, 10));
        if (totalSeats + seatCount <= maxMembers) {
          pivotValues.push([id, mId, seatCount, now, now]);
          totalSeats += seatCount;
        }
      }

      if (pivotValues.length > 0) {
        await conn.query(`
          INSERT INTO committee_member (committee_id, member_id, seats, created_at, updated_at)
          VALUES ?
        `, [pivotValues]);
      }
    }

    await recalculateSchedules(id, conn);

    await conn.commit();

    return res.json({
      success: true,
      message: `Committee "${name}" updated successfully!`
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
}

export async function deleteCommittee(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const [existing] = await conn.query('SELECT * FROM committees WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Committee not found' });
    }

    if (existing[0].status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed and cannot be deleted.' });
    }

    await conn.beginTransaction();

    const [schedules] = await conn.query('SELECT id FROM committee_schedules WHERE committee_id = ?', [id]);
    const scheduleIds = schedules.map(s => s.id);

    if (scheduleIds.length > 0) {
      await conn.query('DELETE FROM committee_member_payments WHERE schedule_id IN (?)', [scheduleIds]);
      await conn.query('DELETE FROM member_bids WHERE schedule_id IN (?)', [scheduleIds]);
      await conn.query('DELETE FROM committee_schedules WHERE committee_id = ?', [id]);
    }

    await conn.query('DELETE FROM committee_member WHERE committee_id = ?', [id]);
    await conn.query('DELETE FROM committees WHERE id = ?', [id]);

    await conn.commit();

    return res.json({ success: true, message: 'Committee deleted successfully' });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
}

export async function updateWinner(req, res) {
  try {
    const { scheduleId } = req.params;
    const { member_id, draw_date } = req.body;

    // Validate scheduleId is a number to prevent injection
    if (!Number.isInteger(Number(scheduleId))) {
      return res.status(400).json({ success: false, message: 'Invalid schedule ID' });
    }

    const [schedules] = await pool.query(`
      SELECT cs.*, c.status as committee_status 
      FROM committee_schedules cs 
      JOIN committees c ON cs.committee_id = c.id 
      WHERE cs.id = ?
    `, [scheduleId]);

    if (schedules.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    if (schedules[0].committee_status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed. Winner cannot be updated.' });
    }

    // Build safe parameterized update — only whitelisted fields
    const updates = ['updated_at = NOW()'];
    const params = [];

    if (member_id !== undefined) {
      updates.push('member_id = ?');
      params.push(member_id === null || member_id === '' ? null : parseInt(member_id, 10));
    }
    if (draw_date) {
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(draw_date)) {
        return res.status(422).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD.' });
      }
      updates.push('draw_date = ?');
      params.push(draw_date);
    }
    params.push(Number(scheduleId));

    await pool.query(`UPDATE committee_schedules SET ${updates.join(', ')} WHERE id = ?`, params);

    return res.json({
      success: true,
      message: `Draw winner updated for Month ${schedules[0].month_no}`
    });
  } catch (error) {
    console.error('updateWinner error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating winner' });
  }
}

export async function updateScheduleDate(req, res) {
  try {
    const { scheduleId } = req.params;
    const { draw_date } = req.body;

    if (!draw_date) {
      return res.status(422).json({ success: false, message: 'Draw date is required' });
    }

    const [schedules] = await pool.query(`
      SELECT cs.*, c.status as committee_status 
      FROM committee_schedules cs 
      JOIN committees c ON cs.committee_id = c.id 
      WHERE cs.id = ?
    `, [scheduleId]);

    if (schedules.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    if (schedules[0].committee_status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed. Draw date cannot be modified.' });
    }

    await pool.query(
      'UPDATE committee_schedules SET draw_date = ?, updated_at = NOW() WHERE id = ?',
      [draw_date, scheduleId]
    );

    return res.json({
      success: true,
      message: `Draw date for Month ${schedules[0].month_no} updated successfully!`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updatePayout(req, res) {
  try {
    const { scheduleId } = req.params;
    const {
      payout_status,
      payout_date,
      payout_mode,
      payout_upi_amount,
      payout_upi_ref,
      payout_cash_amount,
      note_500,
      note_200,
      note_100,
      note_50,
      note_20,
      note_10,
      note_5,
      payout_remarks
    } = req.body;

    const [schedules] = await pool.query(`
      SELECT cs.*, c.status as committee_status 
      FROM committee_schedules cs 
      JOIN committees c ON cs.committee_id = c.id 
      WHERE cs.id = ?
    `, [scheduleId]);

    if (schedules.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    if (schedules[0].committee_status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed. Payout details cannot be modified.' });
    }

    const cashNotes = {
      '500': parseInt(note_500 || 0, 10),
      '200': parseInt(note_200 || 0, 10),
      '100': parseInt(note_100 || 0, 10),
      '50': parseInt(note_50 || 0, 10),
      '20': parseInt(note_20 || 0, 10),
      '10': parseInt(note_10 || 0, 10),
      '5': parseInt(note_5 || 0, 10)
    };

    const calculatedCashTotal = (cashNotes['500'] * 500) +
                                (cashNotes['200'] * 200) +
                                (cashNotes['100'] * 100) +
                                (cashNotes['50'] * 50) +
                                (cashNotes['20'] * 20) +
                                (cashNotes['10'] * 10) +
                                (cashNotes['5'] * 5);

    let finalCashAmount = parseFloat(payout_cash_amount || 0);
    if (finalCashAmount === 0 && calculatedCashTotal > 0) {
      finalCashAmount = calculatedCashTotal;
    }

    const statusVal = payout_status === 'paid' ? 'paid' : 'unpaid';
    const effectivePayoutDate = statusVal === 'paid' ? (payout_date || new Date().toISOString().split('T')[0]) : null;

    await pool.query(`
      UPDATE committee_schedules 
      SET 
        payout_status = ?,
        payout_date = ?,
        payout_mode = ?,
        payout_upi_amount = ?,
        payout_upi_ref = ?,
        payout_cash_amount = ?,
        payout_cash_notes = ?,
        payout_remarks = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      statusVal,
      effectivePayoutDate,
      payout_mode || null,
      parseFloat(payout_upi_amount || 0),
      payout_upi_ref || null,
      finalCashAmount,
      JSON.stringify(cashNotes),
      payout_remarks || null,
      scheduleId
    ]);

    return res.json({
      success: true,
      message: `Winner Payout Disbursement details updated for Month ${schedules[0].month_no}`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateAuctionBid(req, res) {
  const conn = await pool.getConnection();
  try {
    const { scheduleId } = req.params;
    const { custom_deduction_amount } = req.body;

    const [schedules] = await conn.query(`
      SELECT cs.*, c.total_amount, c.total_members, c.status as committee_status 
      FROM committee_schedules cs 
      JOIN committees c ON cs.committee_id = c.id 
      WHERE cs.id = ?
    `, [scheduleId]);

    if (schedules.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const sched = schedules[0];
    if (sched.committee_status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed. Deduction/Bidding cannot be modified.' });
    }

    if (sched.payout_status === 'paid') {
      return res.status(422).json({ success: false, message: `Cannot modify Month ${sched.month_no} because payout is already Paid & Closed.` });
    }

    const v = parseFloat(sched.total_amount);
    const m = parseInt(sched.total_members, 10);
    const customDeduction = parseFloat(custom_deduction_amount || 0);

    const netPayout = v - customDeduction;
    const installmentPerMember = netPayout / m;

    await conn.beginTransaction();

    await conn.query(`
      UPDATE committee_schedules 
      SET 
        custom_deduction_amount = ?,
        deduction_amount = ?,
        is_custom_bid = 1,
        net_payout = ?,
        installment_per_member = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [customDeduction, customDeduction, netPayout, installmentPerMember, scheduleId]);

    await conn.query(`
      UPDATE committee_member_payments 
      SET amount_paid = ?, updated_at = NOW() 
      WHERE schedule_id = ?
    `, [installmentPerMember, scheduleId]);

    await conn.commit();

    return res.json({
      success: true,
      message: `Custom auction bid updated for Month ${sched.month_no}. Installment per member recalculated to ₹${installmentPerMember.toFixed(2)}`
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
}

export async function lockFormulaDefault(req, res) {
  const conn = await pool.getConnection();
  try {
    const { scheduleId } = req.params;

    const [schedules] = await conn.query(`
      SELECT cs.*, c.total_amount, c.total_members, c.deduction_rate, c.special_month_index, c.status as committee_status 
      FROM committee_schedules cs 
      JOIN committees c ON cs.committee_id = c.id 
      WHERE cs.id = ?
    `, [scheduleId]);

    if (schedules.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const sched = schedules[0];
    if (sched.committee_status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed. Bidding cannot be modified.' });
    }

    if (sched.payout_status === 'paid') {
      return res.status(422).json({ success: false, message: `Cannot lock Month ${sched.month_no} because payout is already Paid & Closed.` });
    }

    const v = parseFloat(sched.total_amount);
    const m = parseInt(sched.total_members, 10);
    const r = parseFloat(sched.deduction_rate);
    const baseUnit = (v * r) / 100;
    const specialIndex = parseInt(sched.special_month_index, 10);

    const formulaDeduction = (sched.index_n === specialIndex) ? 0.0 : (sched.index_n * baseUnit);
    const netPayout = v - formulaDeduction;
    const installmentPerMember = netPayout / m;

    await conn.beginTransaction();

    await conn.query(`
      UPDATE committee_schedules 
      SET 
        custom_deduction_amount = ?,
        deduction_amount = ?,
        is_custom_bid = 1,
        net_payout = ?,
        installment_per_member = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [formulaDeduction, formulaDeduction, netPayout, installmentPerMember, scheduleId]);

    await conn.query(`
      UPDATE committee_member_payments 
      SET amount_paid = ?, updated_at = NOW() 
      WHERE schedule_id = ?
    `, [installmentPerMember, scheduleId]);

    await conn.commit();

    return res.json({
      success: true,
      message: `Month ${sched.month_no} locked at formula amount (₹${formulaDeduction.toFixed(2)}). Bidding closed.`
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
}

export async function approveMemberBid(req, res) {
  const conn = await pool.getConnection();
  try {
    const { bidId } = req.params;

    const [bids] = await conn.query(`
      SELECT mb.*, cs.month_no, cs.committee_id, m.name as member_name, c.total_amount, c.total_members, c.status as committee_status 
      FROM member_bids mb
      JOIN committee_schedules cs ON mb.schedule_id = cs.id
      JOIN committees c ON cs.committee_id = c.id
      LEFT JOIN members m ON mb.member_id = m.id
      WHERE mb.id = ?
    `, [bidId]);

    if (bids.length === 0) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    const bid = bids[0];
    if (bid.committee_status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed. No modifications are allowed.' });
    }

    const v = parseFloat(bid.total_amount);
    const m = parseInt(bid.total_members, 10);
    const customDeduction = parseFloat(bid.bid_amount);
    const netPayout = v - customDeduction;
    const installmentPerMember = netPayout / m;

    await conn.beginTransaction();

    await conn.query('UPDATE member_bids SET status = "rejected" WHERE schedule_id = ?', [bid.schedule_id]);
    await conn.query('UPDATE member_bids SET status = "approved" WHERE id = ?', [bidId]);

    await conn.query(`
      UPDATE committee_schedules 
      SET 
        custom_deduction_amount = ?,
        deduction_amount = ?,
        is_custom_bid = 1,
        net_payout = ?,
        installment_per_member = ?,
        member_id = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [customDeduction, customDeduction, netPayout, installmentPerMember, bid.member_id, bid.schedule_id]);

    await conn.query(`
      UPDATE committee_member_payments 
      SET amount_paid = ?, updated_at = NOW() 
      WHERE schedule_id = ?
    `, [installmentPerMember, bid.schedule_id]);

    await conn.commit();

    return res.json({
      success: true,
      message: `Approved auction bid of ₹${customDeduction.toFixed(2)} from ${bid.member_name || 'Member'}!`
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
}

export async function updateMembersSync(req, res) {
  const conn = await pool.getConnection();
  try {
    const { committeeId } = req.params;
    const { members, seats } = req.body;

    const [committees] = await conn.query('SELECT * FROM committees WHERE id = ?', [committeeId]);
    if (committees.length === 0) {
      return res.status(404).json({ success: false, message: 'Committee not found' });
    }

    const committee = committees[0];
    if (committee.status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed. Member list cannot be modified.' });
    }

    const memberIds = Array.isArray(members) ? members : [];
    const seatsMap = seats || {};
    const maxMembers = parseInt(committee.total_members, 10);

    let totalSeats = 0;
    const pivotValues = [];
    const now = new Date();

    for (const mId of memberIds) {
      const seatCount = Math.max(1, parseInt(seatsMap[mId] || 1, 10));
      totalSeats += seatCount;
      pivotValues.push([committeeId, mId, seatCount, now, now]);
    }

    if (totalSeats > maxMembers) {
      return res.status(422).json({
        success: false,
        message: `Cannot assign more than ${maxMembers} total seats to this ${maxMembers}-month committee. (Selected: ${totalSeats} seats).`
      });
    }

    await conn.beginTransaction();

    await conn.query('DELETE FROM committee_member WHERE committee_id = ?', [committeeId]);

    if (pivotValues.length > 0) {
      await conn.query(`
        INSERT INTO committee_member (committee_id, member_id, seats, created_at, updated_at)
        VALUES ?
      `, [pivotValues]);
    }

    await syncMemberPayments(committeeId, conn);

    await conn.commit();

    return res.json({
      success: true,
      message: `Committee members & seats updated successfully (${totalSeats}/${maxMembers} seats assigned)!`
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
}
