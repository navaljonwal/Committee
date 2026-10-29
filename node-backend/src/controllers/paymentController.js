import pool from '../config/db.js';
import { getTodayDateStr, getDaysDifference, addDaysToDate } from '../utils/dateUtils.js';
import { applyAutoPenaltiesForSchedule } from '../services/penaltyService.js';

export async function getSchedulePayments(req, res) {
  try {
    const { scheduleId } = req.params;

    // Apply auto-penalties if due date has passed
    await applyAutoPenaltiesForSchedule(scheduleId);

    const [schedules] = await pool.query(`
      SELECT 
        cs.*, 
        c.name as committee_name, 
        c.total_amount, 
        c.status as committee_status,
        c.payment_grace_days,
        c.late_penalty_amount,
        m.name as winner_name,
        m.phone as winner_phone
      FROM committee_schedules cs
      JOIN committees c ON cs.committee_id = c.id
      LEFT JOIN members m ON cs.member_id = m.id
      WHERE cs.id = ?
    `, [scheduleId]);

    if (schedules.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule round not found' });
    }

    const schedule = schedules[0];
    const todayStr = getTodayDateStr();
    const graceDays = parseInt(schedule.payment_grace_days !== undefined && schedule.payment_grace_days !== null ? schedule.payment_grace_days : 5, 10);
    const penaltyPerSeat = parseFloat(schedule.late_penalty_amount !== undefined && schedule.late_penalty_amount !== null ? schedule.late_penalty_amount : 100.00);
    const dueDateStr = schedule.draw_date ? addDaysToDate(schedule.draw_date, graceDays) : null;
    const isOverdue = dueDateStr ? todayStr > dueDateStr : false;
    const daysUntilDue = dueDateStr ? getDaysDifference(todayStr, dueDateStr) : null;

    // Auto-settle winning member's seats (1 seat or 2 seats) in committee_member_payments if round winner is declared
    if (schedule.member_id) {
      await pool.query(`
        UPDATE committee_member_payments 
        SET payment_status = 'paid', 
            payment_date = COALESCE(payment_date, ?), 
            remarks = 'Draw Winner (Settled in Payout)', 
            penalty_amount = 0.00, 
            updated_at = NOW() 
        WHERE schedule_id = ? 
          AND member_id = ? 
          AND (payment_status = 'pending' OR remarks IS NULL OR remarks != 'Draw Winner (Settled in Payout)')
      `, [schedule.draw_date || todayStr, scheduleId, schedule.member_id]);
    }

    // Fetch payments for enrolled members only
    const [payments] = await pool.query(`
      SELECT 
        cmp.*,
        m.name as member_name,
        m.phone as member_phone,
        (cmp.amount_paid + cmp.penalty_amount) as total_due
      FROM committee_member_payments cmp
      JOIN members m ON cmp.member_id = m.id
      JOIN committee_member cm ON (cm.member_id = cmp.member_id AND cm.committee_id = ?)
      WHERE cmp.schedule_id = ?
      ORDER BY m.name ASC, cmp.seat_no ASC
    `, [schedule.committee_id, scheduleId]);

    const winnerMemberId = schedule.member_id ? Number(schedule.member_id) : null;
    const isWinnerSeat = (p) => winnerMemberId && Number(p.member_id) === winnerMemberId;

    const winnerPayments = payments.filter(isWinnerSeat);
    const nonWinnerPayments = payments.filter(p => !isWinnerSeat(p));

    // Winner installment amount settled against payout pot (not collected in cash)
    const winnerSettledAmount = winnerPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount_paid || 0), 0
    );

    // Cash actually collected from non-winner members in hand (with penalties)
    const cashCollected = nonWinnerPayments
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount_paid || 0) + parseFloat(p.penalty_amount || 0), 0);

    // Total pot collected = cash collected + winner settled installment amount
    const totalPotCollected = cashCollected + winnerSettledAmount;

    // Remaining cash pending from non-winner members
    const totalPending = nonWinnerPayments
      .filter(p => p.payment_status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount_paid || 0) + parseFloat(p.penalty_amount || 0), 0);

    const totalPenalty = payments
      .reduce((sum, p) => sum + parseFloat(p.penalty_amount || 0), 0);

    const uniqueMemberIds = new Set(payments.map(p => p.member_id));

    const collectibleSeats = nonWinnerPayments.length;
    const paidCollectedSeats = nonWinnerPayments.filter(p => p.payment_status === 'paid').length;
    const pendingSeats = nonWinnerPayments.filter(p => p.payment_status === 'pending').length;

    return res.json({
      success: true,
      schedule: {
        ...schedule,
        due_date: dueDateStr,
        is_overdue: isOverdue,
        days_until_due: daysUntilDue
      },
      payments,
      stats: {
        total_payments: payments.length,
        total_members: uniqueMemberIds.size,
        collectible_seats: collectibleSeats,
        paid_collected_seats: paidCollectedSeats,
        paid_count: winnerPayments.length > 0 ? paidCollectedSeats : payments.filter(p => p.payment_status === 'paid').length,
        pending_count: pendingSeats,
        cash_collected: parseFloat(cashCollected.toFixed(2)),
        winner_settled_amount: parseFloat(winnerSettledAmount.toFixed(2)),
        winner_settled_seats: winnerPayments.length,
        total_collected: parseFloat(cashCollected.toFixed(2)),
        total_pot_collected: parseFloat(totalPotCollected.toFixed(2)),
        total_pending: parseFloat(totalPending.toFixed(2)),
        total_penalty: parseFloat(totalPenalty.toFixed(2)),
        is_overdue: isOverdue
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function togglePayment(req, res) {
  try {
    const { paymentId } = req.params;

    const [payments] = await pool.query(`
      SELECT cmp.*, cs.member_id as round_winner_id, c.status as committee_status 
      FROM committee_member_payments cmp
      JOIN committee_schedules cs ON cmp.schedule_id = cs.id
      JOIN committees c ON cs.committee_id = c.id
      WHERE cmp.id = ?
    `, [paymentId]);

    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const payment = payments[0];
    if (payment.committee_status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed. Payments cannot be modified.' });
    }

    // Protection: If this seat belongs to the round winner, ALL their seats are settled in payout
    if (payment.round_winner_id && Number(payment.round_winner_id) === Number(payment.member_id)) {
      return res.status(400).json({
        success: false,
        message: 'This member won this round! All their seat installments are settled in payout and cannot be marked pending.'
      });
    }

    const newStatus = payment.payment_status === 'paid' ? 'pending' : 'paid';
    const newDate = newStatus === 'paid' ? getTodayDateStr() : null;

    await pool.query(`
      UPDATE committee_member_payments 
      SET payment_status = ?, payment_date = ?, updated_at = NOW() 
      WHERE id = ?
    `, [newStatus, newDate, paymentId]);

    return res.json({
      success: true,
      status: newStatus,
      payment_date: newDate,
      message: 'Payment status updated!'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updatePenalty(req, res) {
  try {
    const { paymentId } = req.params;
    const { penalty_amount, remarks } = req.body;

    const [payments] = await pool.query(`
      SELECT cmp.*, c.status as committee_status 
      FROM committee_member_payments cmp
      JOIN committee_schedules cs ON cmp.schedule_id = cs.id
      JOIN committees c ON cs.committee_id = c.id
      WHERE cmp.id = ?
    `, [paymentId]);

    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const payment = payments[0];
    if (payment.committee_status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed. Late penalty cannot be modified.' });
    }

    const penaltyVal = Math.max(0, parseFloat(penalty_amount || 0));

    // Admin manually editing penalty -> set is_penalty_manual = 1
    await pool.query(`
      UPDATE committee_member_payments 
      SET penalty_amount = ?, remarks = ?, is_penalty_manual = 1, updated_at = NOW() 
      WHERE id = ?
    `, [penaltyVal, remarks || null, paymentId]);

    const totalDue = parseFloat(payment.amount_paid) + penaltyVal;

    return res.json({
      success: true,
      penalty_amount: penaltyVal,
      total_due: parseFloat(totalDue.toFixed(2)),
      message: 'Late payment penalty updated successfully!'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function waivePenalty(req, res) {
  try {
    const { paymentId } = req.params;

    const [payments] = await pool.query(`
      SELECT cmp.*, c.status as committee_status 
      FROM committee_member_payments cmp
      JOIN committee_schedules cs ON cmp.schedule_id = cs.id
      JOIN committees c ON cs.committee_id = c.id
      WHERE cmp.id = ?
    `, [paymentId]);

    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const payment = payments[0];
    if (payment.committee_status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed.' });
    }

    // Waive penalty to 0 and mark is_penalty_manual = 1 so auto penalty won't re-apply
    await pool.query(`
      UPDATE committee_member_payments 
      SET penalty_amount = 0.00, remarks = 'Penalty waived by admin', is_penalty_manual = 1, updated_at = NOW() 
      WHERE id = ?
    `, [paymentId]);

    return res.json({
      success: true,
      penalty_amount: 0,
      total_due: parseFloat(payment.amount_paid),
      message: 'Late penalty waived successfully!'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function resetPenalty(req, res) {
  try {
    const { paymentId } = req.params;

    const [payments] = await pool.query(`
      SELECT cmp.*, c.status as committee_status 
      FROM committee_member_payments cmp
      JOIN committee_schedules cs ON cmp.schedule_id = cs.id
      JOIN committees c ON cs.committee_id = c.id
      WHERE cmp.id = ?
    `, [paymentId]);

    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const payment = payments[0];
    if (payment.committee_status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed.' });
    }

    // Reset is_penalty_manual to 0 so auto-rule applies
    await pool.query(`
      UPDATE committee_member_payments 
      SET is_penalty_manual = 0, remarks = NULL, updated_at = NOW() 
      WHERE id = ?
    `, [paymentId]);

    // Re-apply auto penalties for this schedule
    await applyAutoPenaltiesForSchedule(payment.schedule_id);

    return res.json({
      success: true,
      message: 'Penalty reset to automatic calculation!'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function applySchedulePenaltiesAction(req, res) {
  try {
    const { scheduleId } = req.params;
    const result = await applyAutoPenaltiesForSchedule(scheduleId);
    return res.json({
      success: true,
      result,
      message: result.updated > 0
        ? `Applied late penalty of ₹${result.penaltyPerSeat} to ${result.updated} seat(s)!`
        : 'All penalties are up to date!'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function markAllPaid(req, res) {
  try {
    const { scheduleId } = req.params;

    const [schedules] = await pool.query(`
      SELECT cs.*, c.status as committee_status 
      FROM committee_schedules cs 
      JOIN committees c ON cs.committee_id = c.id 
      WHERE cs.id = ?
    `, [scheduleId]);

    if (schedules.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const schedule = schedules[0];
    if (schedule.committee_status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed. Payments cannot be modified.' });
    }

    const todayStr = getTodayDateStr();

    await pool.query(`
      UPDATE committee_member_payments 
      SET payment_status = 'paid', payment_date = ?, updated_at = NOW() 
      WHERE schedule_id = ?
    `, [todayStr, scheduleId]);

    return res.json({
      success: true,
      message: `All member payments for Month ${schedule.month_no} marked as PAID successfully!`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleMemberPayments(req, res) {
  try {
    const { scheduleId, memberId } = req.params;

    const [schedules] = await pool.query(`
      SELECT cs.*, c.status as committee_status 
      FROM committee_schedules cs 
      JOIN committees c ON cs.committee_id = c.id 
      WHERE cs.id = ?
    `, [scheduleId]);

    if (schedules.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule round not found' });
    }

    const schedule = schedules[0];
    if (schedule.committee_status === 'completed') {
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed. Payments cannot be modified.' });
    }

    const [payments] = await pool.query(`
      SELECT * FROM committee_member_payments 
      WHERE schedule_id = ? AND member_id = ?
    `, [scheduleId, memberId]);

    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment records not found for this member' });
    }

    const isWinner = schedule.member_id && Number(schedule.member_id) === Number(memberId);

    // If member is the winner of this round, all their seats (1 seat or 2 seats) are settled in payout
    if (isWinner) {
      return res.status(400).json({
        success: false,
        message: 'This member is the round winner. All their seats are settled in payout and do not require collection.'
      });
    }

    const hasPending = payments.some(p => p.payment_status === 'pending');
    const newStatus = hasPending ? 'paid' : 'pending';
    const newDate = newStatus === 'paid' ? getTodayDateStr() : null;

    await pool.query(`
      UPDATE committee_member_payments 
      SET payment_status = ?, payment_date = ?, updated_at = NOW() 
      WHERE schedule_id = ? AND member_id = ?
    `, [newStatus, newDate, scheduleId, memberId]);

    return res.json({
      success: true,
      status: newStatus,
      payment_date: newDate,
      message: newStatus === 'paid' 
        ? `Payment marked as PAID for all ${payments.length} seat(s)!` 
        : `Payment marked as PENDING for all ${payments.length} seat(s)!`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
