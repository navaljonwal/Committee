import pool from '../config/db.js';

export async function getSchedulePayments(req, res) {
  try {
    const { scheduleId } = req.params;

    const [schedules] = await pool.query(`
      SELECT 
        cs.*, 
        c.name as committee_name, 
        c.total_amount, 
        c.status as committee_status,
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

    const totalCollected = payments
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount_paid || 0) + parseFloat(p.penalty_amount || 0), 0);

    const totalPending = payments
      .filter(p => p.payment_status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount_paid || 0) + parseFloat(p.penalty_amount || 0), 0);

    return res.json({
      success: true,
      schedule,
      payments,
      stats: {
        total_payments: payments.length,
        paid_count: payments.filter(p => p.payment_status === 'paid').length,
        pending_count: payments.filter(p => p.payment_status === 'pending').length,
        total_collected: parseFloat(totalCollected.toFixed(2)),
        total_pending: parseFloat(totalPending.toFixed(2))
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
      return res.status(422).json({ success: false, message: 'This committee is Completed & Closed. Payments cannot be modified.' });
    }

    const newStatus = payment.payment_status === 'paid' ? 'pending' : 'paid';
    const newDate = newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null;

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

    await pool.query(`
      UPDATE committee_member_payments 
      SET penalty_amount = ?, remarks = ?, updated_at = NOW() 
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

    const todayStr = new Date().toISOString().split('T')[0];

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
