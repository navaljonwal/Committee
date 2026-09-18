import pool from '../config/db.js';
import { addMonthsToDate } from '../services/formula.js';
import { getTodayDateStr, formatDbDate } from '../utils/dateUtils.js';

export async function getMemberDashboard(req, res) {
  try {
    const user = req.user;
    const memberId = user.member_id;

    if (!memberId) {
      return res.json({
        success: true,
        user,
        member: null,
        committees: [],
        myBids: [],
        pendingPayments: []
      });
    }

    const [members] = await pool.query('SELECT * FROM members WHERE id = ?', [memberId]);
    const member = members[0] || null;

    // Committees member is enrolled in
    const [committees] = await pool.query(`
      SELECT 
        c.*, 
        cm.seats,
        (SELECT COUNT(*) FROM committee_schedules cs WHERE cs.committee_id = c.id) as schedules_count,
        (SELECT COUNT(*) FROM committee_schedules cs WHERE cs.committee_id = c.id AND cs.member_id = ?) as won_count
      FROM committees c
      INNER JOIN committee_member cm ON c.id = cm.committee_id
      WHERE cm.member_id = ?
      ORDER BY c.created_at DESC
    `, [memberId, memberId]);

    // Member's recent bids
    const [myBids] = await pool.query(`
      SELECT 
        mb.*,
        cs.month_no,
        c.name as committee_name
      FROM member_bids mb
      JOIN committee_schedules cs ON mb.schedule_id = cs.id
      JOIN committees c ON cs.committee_id = c.id
      WHERE mb.member_id = ?
      ORDER BY mb.created_at DESC
    `, [memberId]);

    // Member's pending payments
    const [pendingPayments] = await pool.query(`
      SELECT 
        cmp.*,
        cs.month_no,
        cs.draw_date,
        c.name as committee_name,
        (cmp.amount_paid + cmp.penalty_amount) as total_due
      FROM committee_member_payments cmp
      JOIN committee_schedules cs ON cmp.schedule_id = cs.id
      JOIN committees c ON cs.committee_id = c.id
      WHERE cmp.member_id = ? AND cmp.payment_status = 'pending'
      ORDER BY cs.month_no ASC
    `, [memberId]);

    return res.json({
      success: true,
      user,
      member,
      committees,
      myBids,
      pendingPayments
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMemberCommittee(req, res) {
  try {
    const user = req.user;
    const memberId = user.member_id;
    const { committeeId } = req.params;

    if (!memberId && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'No member profile attached to this account' });
    }

    const [committees] = await pool.query('SELECT * FROM committees WHERE id = ?', [committeeId]);
    if (committees.length === 0) {
      return res.status(404).json({ success: false, message: 'Committee not found' });
    }
    const committee = committees[0];

    // Verify enrollment
    const [enrollment] = await pool.query(
      'SELECT seats FROM committee_member WHERE committee_id = ? AND member_id = ?',
      [committeeId, memberId]
    );

    if (user.role !== 'admin' && enrollment.length === 0) {
      return res.status(403).json({ success: false, message: 'You are not enrolled in this committee' });
    }

    const totalSeats = enrollment.length > 0 ? parseInt(enrollment[0].seats || 1, 10) : 1;

    // Load schedules with winner info
    const [schedules] = await pool.query(`
      SELECT 
        cs.*,
        m.name as winner_name,
        m.phone as winner_phone
      FROM committee_schedules cs
      LEFT JOIN members m ON cs.member_id = m.id
      WHERE cs.committee_id = ?
      ORDER BY cs.month_no ASC
    `, [committeeId]);

    // Member's payments grouped by schedule
    const [myPayments] = await pool.query(`
      SELECT * FROM committee_member_payments 
      WHERE member_id = ? AND schedule_id IN (SELECT id FROM committee_schedules WHERE committee_id = ?)
      ORDER BY seat_no ASC
    `, [memberId, committeeId]);

    const myPaymentsBySchedule = {};
    for (const p of myPayments) {
      if (!myPaymentsBySchedule[p.schedule_id]) myPaymentsBySchedule[p.schedule_id] = [];
      myPaymentsBySchedule[p.schedule_id].push(p);
    }

    // Member's bids
    const [myBids] = await pool.query(`
      SELECT * FROM member_bids 
      WHERE member_id = ? AND schedule_id IN (SELECT id FROM committee_schedules WHERE committee_id = ?)
    `, [memberId, committeeId]);

    const myBidsBySchedule = {};
    for (const b of myBids) {
      myBidsBySchedule[b.schedule_id] = b;
    }

    // All bids from all members grouped by schedule
    const [allBids] = await pool.query(`
      SELECT mb.*, m.name as member_name 
      FROM member_bids mb
      JOIN members m ON mb.member_id = m.id
      WHERE mb.schedule_id IN (SELECT id FROM committee_schedules WHERE committee_id = ?)
      ORDER BY mb.bid_amount DESC
    `, [committeeId]);

    const allBidsBySchedule = {};
    for (const b of allBids) {
      if (!allBidsBySchedule[b.schedule_id]) allBidsBySchedule[b.schedule_id] = [];
      allBidsBySchedule[b.schedule_id].push(b);
    }

    const [wonRounds] = await pool.query(
      'SELECT COUNT(*) as won_count FROM committee_schedules WHERE committee_id = ? AND member_id = ?',
      [committeeId, memberId]
    );
    const wonCount = parseInt(wonRounds[0].won_count || 0, 10);
    const remainingSeats = Math.max(0, totalSeats - wonCount);
    const alreadyWonAllSeats = (wonCount >= totalSeats);

    return res.json({
      success: true,
      committee,
      schedules,
      totalSeats,
      wonCount,
      remainingSeats,
      alreadyWonAllSeats,
      myPayments: myPaymentsBySchedule,
      myBids: myBidsBySchedule,
      allBids: allBidsBySchedule
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getLiveBids(req, res) {
  try {
    const { committeeId } = req.params;
    const user = req.user;
    const memberId = user.member_id;

    const [committees] = await pool.query('SELECT * FROM committees WHERE id = ?', [committeeId]);
    if (committees.length === 0) {
      return res.status(404).json({ error: 'Committee not found' });
    }
    const committee = committees[0];

    const [schedules] = await pool.query(
      'SELECT * FROM committee_schedules WHERE committee_id = ? ORDER BY month_no ASC',
      [committeeId]
    );

    const [bids] = await pool.query(`
      SELECT mb.*, m.name as member_name 
      FROM member_bids mb
      JOIN members m ON mb.member_id = m.id
      WHERE mb.schedule_id IN (SELECT id FROM committee_schedules WHERE committee_id = ?)
      ORDER BY mb.bid_amount DESC
    `, [committeeId]);

    const allBids = {};
    for (const s of schedules) {
      allBids[s.id] = [];
    }

    for (const b of bids) {
      if (!allBids[b.schedule_id]) allBids[b.schedule_id] = [];
      allBids[b.schedule_id].push({
        id: b.id,
        member_id: b.member_id,
        my_bid: memberId ? (b.member_id === memberId) : false,
        name: b.member_name,
        bid_amount: parseFloat(b.bid_amount),
        remarks: b.remarks,
        status: b.status
      });
    }

    const highestBids = {};
    for (const s of schedules) {
      const sBids = allBids[s.id] || [];
      const top = sBids.length > 0 ? sBids[0] : null;
      const baseDeduct = parseFloat(s.deduction_amount || 0);
      const topAmount = top ? parseFloat(top.bid_amount) : 0.0;
      const minNextBid = topAmount > 0 ? (topAmount + 1) : Math.max(0, baseDeduct);

      highestBids[s.id] = {
        amount: top ? parseFloat(top.bid_amount) : null,
        name: top ? top.name : null,
        id: top ? top.id : null,
        base_deduction: baseDeduct,
        min_next_bid: minNextBid
      };
    }

    const today = getTodayDateStr();
    const lockStatus = {};

    for (const s of schedules) {
      const effectiveDrawDate = formatDbDate(s.draw_date) 
        || (committee.start_date ? addMonthsToDate(committee.start_date, s.month_no - 1) : null);

      let dateStatus = 'today';
      if (effectiveDrawDate) {
        if (today < effectiveDrawDate) {
          dateStatus = 'before';
        } else if (today > effectiveDrawDate) {
          dateStatus = 'after';
        }
      }

      lockStatus[s.id] = {
        is_locked: Boolean(s.is_custom_bid),
        month_no: s.month_no,
        winner_id: s.member_id,
        date_status: dateStatus,
        draw_date: effectiveDrawDate
      };
    }

    return res.json({
      timestamp: new Date().toISOString(),
      bids: allBids,
      highest_bids: highestBids,
      lock_status: lockStatus
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function submitBid(req, res) {
  try {
    const user = req.user;
    const memberId = user.member_id;
    const { scheduleId } = req.params;
    const { bid_amount, remarks } = req.body;

    if (!memberId) {
      return res.status(403).json({ success: false, message: 'No member profile attached to this account' });
    }

    const [schedules] = await pool.query(`
      SELECT cs.*, c.total_amount, c.total_members, c.start_date, c.status as committee_status 
      FROM committee_schedules cs
      JOIN committees c ON cs.committee_id = c.id
      WHERE cs.id = ?
    `, [scheduleId]);

    if (schedules.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const schedule = schedules[0];

    if (schedule.committee_status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed. No new bids can be submitted.' });
    }

    // GUARD 1: Round locked
    if (schedule.is_custom_bid) {
      return res.status(422).json({
        success: false,
        message: `Bidding for Month ${schedule.month_no} has been closed by the organizer.`
      });
    }

    // GUARD 2: Draw date check
    const effectiveDrawDate = formatDbDate(schedule.draw_date) 
      || (schedule.start_date ? addMonthsToDate(schedule.start_date, schedule.month_no - 1) : null);

    if (effectiveDrawDate) {
      const today = getTodayDateStr();
      if (today < effectiveDrawDate) {
        return res.status(422).json({
          success: false,
          message: `Bidding for Month ${schedule.month_no} will open on ${effectiveDrawDate}. You cannot submit a bid before the draw date.`
        });
      }
      if (today > effectiveDrawDate) {
        return res.status(422).json({
          success: false,
          message: `Bidding for Month ${schedule.month_no} closed on ${effectiveDrawDate}. Bids can only be submitted on the draw date.`
        });
      }
    }

    // GUARD 3: Member seats limit
    const [enrollment] = await pool.query(
      'SELECT seats FROM committee_member WHERE committee_id = ? AND member_id = ?',
      [schedule.committee_id, memberId]
    );

    const totalSeats = enrollment.length > 0 ? parseInt(enrollment[0].seats || 1, 10) : 1;
    const [wonCountRows] = await pool.query(
      'SELECT COUNT(*) as won_count FROM committee_schedules WHERE committee_id = ? AND member_id = ?',
      [schedule.committee_id, memberId]
    );
    const wonCount = parseInt(wonCountRows[0].won_count || 0, 10);

    if (wonCount >= totalSeats) {
      return res.status(422).json({
        success: false,
        message: `You have already won draws for all ${totalSeats} of your registered seats in this committee and cannot place new auction bids.`
      });
    }

    const newBidAmount = parseFloat(bid_amount);
    const baseDeduction = parseFloat(schedule.deduction_amount || 0);
    const v = parseFloat(schedule.total_amount);

    if (isNaN(newBidAmount) || newBidAmount < 0 || newBidAmount > v) {
      return res.status(422).json({
        success: false,
        message: `Bid amount must be between 0 and ₹${v}`
      });
    }

    // Strict auction bid check: must be strictly > current highest bid
    const [highestBidRows] = await pool.query(
      'SELECT MAX(bid_amount) as max_bid FROM member_bids WHERE schedule_id = ?',
      [scheduleId]
    );
    const currentHighestBid = parseFloat(highestBidRows[0].max_bid || 0);

    if (currentHighestBid > 0 && newBidAmount <= currentHighestBid) {
      const minRequired = currentHighestBid + 1;
      return res.status(422).json({
        success: false,
        message: `Current highest bid is ₹${currentHighestBid.toLocaleString('en-IN')}. Your bid must be strictly higher (at least ₹${minRequired.toLocaleString('en-IN')}).`
      });
    }

    if (currentHighestBid === 0 && baseDeduction > 0 && newBidAmount < baseDeduction) {
      return res.status(422).json({
        success: false,
        message: `Starting bid for Month ${schedule.month_no} cannot be less than ₹${baseDeduction.toLocaleString('en-IN')}.`
      });
    }

    // Upsert member bid
    const [existingBid] = await pool.query(
      'SELECT id FROM member_bids WHERE schedule_id = ? AND member_id = ?',
      [scheduleId, memberId]
    );

    if (existingBid.length > 0) {
      await pool.query(
        'UPDATE member_bids SET bid_amount = ?, remarks = ?, status = "pending", updated_at = NOW() WHERE id = ?',
        [newBidAmount, remarks || null, existingBid[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO member_bids (schedule_id, member_id, bid_amount, remarks, status, created_at, updated_at) VALUES (?, ?, ?, ?, "pending", NOW(), NOW())',
        [scheduleId, memberId, newBidAmount, remarks || null]
      );
    }

    return res.json({
      success: true,
      message: `Bid placed — ₹${newBidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} for Month ${schedule.month_no}. Visible to all members in real-time.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
