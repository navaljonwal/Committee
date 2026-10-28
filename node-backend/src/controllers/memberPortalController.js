import pool from '../config/db.js';
import { addMonthsToDate } from '../services/formula.js';
import { getTodayDateStr, formatDbDate, addDaysToDate } from '../utils/dateUtils.js';
import { applyAutoPenaltiesGlobal } from '../services/penaltyService.js';

export async function getMemberDashboard(req, res) {
  try {
    const user = req.user;
    let memberId = user.member_id;
    let allMembers = [];

    if (user.role === 'admin') {
      const [mList] = await pool.query(`
        SELECT 
          m.id, 
          m.name, 
          m.phone,
          (SELECT COUNT(*) FROM committee_member cm WHERE cm.member_id = m.id) as enrolled_count
        FROM members m 
        ORDER BY m.name ASC
      `);
      allMembers = mList || [];

      if (req.query.memberId) {
        memberId = parseInt(req.query.memberId, 10);
      } else if (!memberId && allMembers.length > 0) {
        // Prioritize first member who actually has enrolled committees!
        const memberWithCommittees = allMembers.find(m => Number(m.enrolled_count) > 0);
        memberId = memberWithCommittees ? memberWithCommittees.id : allMembers[0].id;
      }
    }

    // Auto-resolve memberId for regular member accounts if users.member_id was not set
    if (!memberId && user.role !== 'admin') {
      if (user.phone) {
        const cleanPhone = user.phone.replace(/[^0-9]/g, '').slice(-10);
        if (cleanPhone) {
          const [mRows] = await pool.query(
            `SELECT id FROM members WHERE REPLACE(REPLACE(phone, '-', ''), ' ', '') LIKE ? LIMIT 1`,
            [`%${cleanPhone}`]
          );
          if (mRows.length > 0) {
            memberId = mRows[0].id;
            try {
              await pool.query('UPDATE users SET member_id = ? WHERE id = ?', [memberId, user.id]);
            } catch (e) {}
          }
        }
      }
      if (!memberId && user.name) {
        const [mRows] = await pool.query('SELECT id FROM members WHERE LOWER(name) = LOWER(?) LIMIT 1', [user.name.trim()]);
        if (mRows.length > 0) {
          memberId = mRows[0].id;
          try {
            await pool.query('UPDATE users SET member_id = ? WHERE id = ?', [memberId, user.id]);
          } catch (e) {}
        }
      }
    }

    if (!memberId) {
      return res.json({
        success: true,
        user,
        member: null,
        committees: [],
        myBids: [],
        pendingPayments: [],
        allMembers
      });
    }

    memberId = parseInt(memberId, 10);

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
    let myBids = [];
    try {
      const [bidRows] = await pool.query(`
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
      myBids = bidRows || [];
    } catch (bidErr) {
      console.warn('Member bids query warning:', bidErr.message);
    }

    // Apply auto-penalties so member sees accurate status
    try {
      await applyAutoPenaltiesGlobal();
    } catch (penErr) {
      console.warn('Auto penalty calculation warning:', penErr.message);
    }

    // Member's pending payments
    let pendingPayments = [];
    try {
      const [pendingRows] = await pool.query(`
        SELECT 
          cmp.*,
          cs.month_no,
          cs.draw_date,
          c.id as committee_id,
          c.payment_grace_days,
          c.late_penalty_amount,
          c.name as committee_name,
          (COALESCE(cmp.amount_paid, 0) + COALESCE(cmp.penalty_amount, 0)) as total_due
        FROM committee_member_payments cmp
        JOIN committee_schedules cs ON cmp.schedule_id = cs.id
        JOIN committees c ON cs.committee_id = c.id
        WHERE cmp.member_id = ? AND cmp.payment_status = 'pending'
        ORDER BY cs.month_no ASC
      `, [memberId]);

      pendingPayments = (pendingRows || []).map(p => {
        const grace = p.payment_grace_days !== undefined && p.payment_grace_days !== null ? Number(p.payment_grace_days) : 5;
        const penaltySetting = p.late_penalty_amount !== undefined && p.late_penalty_amount !== null ? Number(p.late_penalty_amount) : 100.00;
        const dueDate = p.draw_date ? addDaysToDate(p.draw_date, grace) : null;
        const baseAmt = parseFloat(p.amount_paid || 0);
        const penaltyAmt = parseFloat(p.penalty_amount || 0);
        const totalDue = parseFloat(p.total_due !== undefined && p.total_due !== null ? p.total_due : (baseAmt + penaltyAmt));
        return {
          ...p,
          committee_id: p.committee_id || p.committeeId,
          payment_grace_days: grace,
          late_penalty_amount: penaltySetting,
          penalty_amount: penaltyAmt,
          total_due: totalDue,
          due_date: dueDate
        };
      });
    } catch (pendErr) {
      console.warn('Member pending payments query warning:', pendErr.message);
    }

    return res.json({
      success: true,
      user,
      member,
      committees: committees || [],
      myBids,
      pendingPayments,
      allMembers
    });
  } catch (error) {
    console.error('getMemberDashboard error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMemberCommittee(req, res) {
  try {
    const user = req.user;
    let memberId = user.member_id;
    const { committeeId } = req.params;

    if (user.role === 'admin') {
      if (req.query.memberId) {
        memberId = parseInt(req.query.memberId, 10);
      } else if (!memberId) {
        const [firstEnrolled] = await pool.query('SELECT member_id FROM committee_member WHERE committee_id = ? LIMIT 1', [committeeId]);
        if (firstEnrolled.length > 0) memberId = firstEnrolled[0].member_id;
      }
    }

    // Auto-resolve memberId for regular member accounts if users.member_id was not set
    if (!memberId && user.role !== 'admin') {
      if (user.phone) {
        const cleanPhone = user.phone.replace(/[^0-9]/g, '').slice(-10);
        if (cleanPhone) {
          const [mRows] = await pool.query(
            `SELECT id FROM members WHERE REPLACE(REPLACE(phone, '-', ''), ' ', '') LIKE ? LIMIT 1`,
            [`%${cleanPhone}`]
          );
          if (mRows.length > 0) {
            memberId = mRows[0].id;
            try {
              await pool.query('UPDATE users SET member_id = ? WHERE id = ?', [memberId, user.id]);
            } catch (e) {}
          }
        }
      }
      if (!memberId && user.name) {
        const [mRows] = await pool.query('SELECT id FROM members WHERE LOWER(name) = LOWER(?) LIMIT 1', [user.name.trim()]);
        if (mRows.length > 0) {
          memberId = mRows[0].id;
          try {
            await pool.query('UPDATE users SET member_id = ? WHERE id = ?', [memberId, user.id]);
          } catch (e) {}
        }
      }
    }

    if (!memberId && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'No member profile attached to this account' });
    }

    if (memberId) {
      memberId = parseInt(memberId, 10);
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
    const [scheduleRows] = await pool.query(`
      SELECT 
        cs.*,
        c.payment_grace_days,
        c.late_penalty_amount,
        m.name as winner_name,
        m.phone as winner_phone
      FROM committee_schedules cs
      JOIN committees c ON cs.committee_id = c.id
      LEFT JOIN members m ON cs.member_id = m.id
      WHERE cs.committee_id = ?
      ORDER BY cs.month_no ASC
    `, [committeeId]);

    const schedules = scheduleRows.map(cs => {
      const grace = cs.payment_grace_days !== undefined && cs.payment_grace_days !== null ? Number(cs.payment_grace_days) : 5;
      const penaltyAmt = cs.late_penalty_amount !== undefined && cs.late_penalty_amount !== null ? Number(cs.late_penalty_amount) : 100.00;
      const dueDate = cs.draw_date ? addDaysToDate(cs.draw_date, grace) : null;

      const isMyWin = cs.member_id && Number(cs.member_id) === Number(memberId);
      const isWinnerAssigned = Boolean(cs.member_id);

      // Privacy: If regular member, only reveal winner if the viewing member themselves won!
      // Other members see 'Draw Completed' and never see another member's name or phone.
      const safeWinnerName = (user.role === 'admin')
        ? cs.winner_name
        : (isMyWin ? 'Aapne jeeta (You Won)' : (isWinnerAssigned ? 'Draw Completed' : null));

      const safeWinnerPhone = (user.role === 'admin' || isMyWin) ? cs.winner_phone : null;

      return {
        ...cs,
        payment_grace_days: grace,
        late_penalty_amount: penaltyAmt,
        due_date: dueDate,
        is_my_win: isMyWin,
        is_winner_assigned: isWinnerAssigned,
        winner_name: safeWinnerName,
        winner_phone: safeWinnerPhone
      };
    });

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

// In-memory SSE client connections: committeeId -> Set of Response objects
const sseClients = new Map();

/**
 * Register SSE connection for real-time live auction bids
 */
export function subscribeLiveBids(req, res) {
  const { committeeId } = req.params;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write(': connected\n\n');

  const cKey = String(committeeId);
  if (!sseClients.has(cKey)) {
    sseClients.set(cKey, new Set());
  }
  const clientSet = sseClients.get(cKey);
  clientSet.add(res);

  // Send initial data immediately
  buildLiveBidsPayload(committeeId, req.user?.member_id).then((initData) => {
    if (initData) {
      res.write(`data: ${JSON.stringify(initData)}\n\n`);
    }
  }).catch(() => {});

  req.on('close', () => {
    clientSet.delete(res);
    if (clientSet.size === 0) {
      sseClients.delete(cKey);
    }
  });
}

/**
 * Broadcast live bids update to all connected SSE clients for a committee
 */
export function broadcastLiveBids(committeeId, data) {
  const cKey = String(committeeId);
  const clientSet = sseClients.get(cKey);
  if (clientSet && clientSet.size > 0) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of clientSet) {
      try {
        client.write(payload);
      } catch {
        clientSet.delete(client);
      }
    }
  }
}

/**
 * Build consolidated live bids data payload for a committee
 */
export async function buildLiveBidsPayload(committeeId, memberId = null) {
  const [committees] = await pool.query('SELECT * FROM committees WHERE id = ?', [committeeId]);
  if (committees.length === 0) return null;
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
    const isMyBid = memberId ? (Number(b.member_id) === Number(memberId)) : false;
    allBids[b.schedule_id].push({
      id: b.id,
      member_id: isMyBid ? b.member_id : null,
      my_bid: isMyBid,
      name: isMyBid ? 'You (Aap)' : 'Member',
      bid_amount: parseFloat(b.bid_amount),
      remarks: isMyBid ? b.remarks : null,
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
      name: top ? (top.my_bid ? 'You (Aap)' : 'Top Bidder') : null,
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
      } else {
        // Draw date is today or past — closed only if round is locked or winner already assigned
        if (s.member_id || s.is_custom_bid) {
          dateStatus = 'after';
        } else {
          dateStatus = 'today';
        }
      }
    }

    const isMyWin = s.member_id && Number(s.member_id) === Number(memberId);
    lockStatus[s.id] = {
      is_locked: Boolean(s.is_custom_bid),
      month_no: s.month_no,
      winner_id: isMyWin ? s.member_id : (s.member_id ? 'ASSIGNED' : null),
      has_winner: Boolean(s.member_id),
      is_my_win: isMyWin,
      date_status: dateStatus,
      draw_date: effectiveDrawDate
    };
  }

  return {
    timestamp: new Date().toISOString(),
    bids: allBids,
    highest_bids: highestBids,
    lock_status: lockStatus
  };
}

export async function getLiveBids(req, res) {
  try {
    const { committeeId } = req.params;
    const user = req.user;
    const data = await buildLiveBidsPayload(committeeId, user?.member_id);
    if (!data) {
      return res.status(404).json({ error: 'Committee not found' });
    }
    return res.json(data);
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

    // GUARD 2: Winner already assigned
    if (schedule.member_id) {
      return res.status(422).json({
        success: false,
        message: `Month ${schedule.month_no} draw has already been won. Bidding is closed.`
      });
    }

    // GUARD 3: Future draw date check
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
    }

    // GUARD 4: Member seats limit
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
        message: `Bid amount must be between 0 and ₹${v.toLocaleString('en-IN')}`
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

    // Upsert member bid (PostgreSQL safe with single quotes 'pending')
    const [existingBid] = await pool.query(
      'SELECT id FROM member_bids WHERE schedule_id = ? AND member_id = ?',
      [scheduleId, memberId]
    );

    if (existingBid.length > 0) {
      await pool.query(
        "UPDATE member_bids SET bid_amount = ?, remarks = ?, status = 'pending', updated_at = NOW() WHERE id = ?",
        [newBidAmount, remarks || null, existingBid[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO member_bids (schedule_id, member_id, bid_amount, remarks, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())",
        [scheduleId, memberId, newBidAmount, remarks || null]
      );
    }

    // Broadcast instant update to all connected members via SSE
    const updatedLiveBids = await buildLiveBidsPayload(schedule.committee_id);
    if (updatedLiveBids) {
      broadcastLiveBids(schedule.committee_id, updatedLiveBids);
    }

    return res.json({
      success: true,
      message: `Bid placed — ₹${newBidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} for Month ${schedule.month_no}. Visible to all members in real-time!`,
      data: updatedLiveBids
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
