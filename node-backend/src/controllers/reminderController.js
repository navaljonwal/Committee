import pool from '../config/db.js';
import { encodeId, decodeId } from '../utils/hashids.js';

// ─── GET all reminders + auto-generate from pending payments & upcoming draws ───
export async function getReminders(req, res) {
  try {
    const userId = req.user.id;

    // 1. Manual reminders (admin-created)
    const [manualRows] = await pool.query(`
      SELECT r.*, c.name as committee_name
      FROM reminders r
      LEFT JOIN committees c ON r.committee_id = c.id
      WHERE r.status = 'active'
      ORDER BY r.due_date ASC, r.created_at DESC
    `);

    // 2. Auto: Members with pending payments (individual level with phone)
    const [pendingMembers] = await pool.query(`
      SELECT 
        cmp.id as payment_id,
        cmp.amount_paid,
        cmp.penalty_amount,
        (cmp.amount_paid + cmp.penalty_amount) as total_due,
        cmp.seat_no,
        m.id as member_id,
        m.name as member_name,
        m.phone as member_phone,
        cs.id as schedule_id,
        cs.month_no,
        cs.draw_date,
        c.id as committee_id,
        c.name as committee_name
      FROM committee_member_payments cmp
      JOIN members m ON cmp.member_id = m.id
      JOIN committee_schedules cs ON cmp.schedule_id = cs.id
      JOIN committees c ON cs.committee_id = c.id
      WHERE cmp.payment_status = 'pending' AND c.status = 'active'
      ORDER BY cs.draw_date ASC, m.name ASC
      LIMIT 50
    `);

    // 3. Auto: Upcoming draw dates (next 30 days) - portable dates
    const todayStr = new Date().toISOString().slice(0, 10);
    const future30Str = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const [upcomingDraws] = await pool.query(`
      SELECT 
        cs.id as schedule_id,
        cs.month_no,
        cs.draw_date,
        cs.payout_status,
        c.id as committee_id,
        c.name as committee_name
      FROM committee_schedules cs
      JOIN committees c ON cs.committee_id = c.id
      WHERE cs.draw_date BETWEEN ? AND ?
        AND cs.member_id IS NULL
        AND c.status = 'active'
      ORDER BY cs.draw_date ASC
      LIMIT 15
    `, [todayStr, future30Str]);

    // Encode IDs in manual reminders
    const reminders = manualRows.map(r => ({
      ...r,
      hash_id: encodeId(r.id),
      committee_hash_id: r.committee_id ? encodeId(r.committee_id) : null
    }));

    // Encode IDs in auto-alerts
    const paymentAlerts = pendingMembers.map(p => ({
      ...p,
      payment_hash_id: encodeId(p.payment_id),
      schedule_hash_id: encodeId(p.schedule_id),
      committee_hash_id: encodeId(p.committee_id)
    }));

    const drawAlerts = upcomingDraws.map(d => ({
      ...d,
      schedule_hash_id: encodeId(d.schedule_id),
      committee_hash_id: encodeId(d.committee_id)
    }));

    return res.json({
      success: true,
      reminders,
      auto_alerts: {
        pending_payments: paymentAlerts,
        upcoming_draws: drawAlerts
      },
      counts: {
        manual: manualRows.length,
        pending_payments: paymentAlerts.length,
        upcoming_draws: drawAlerts.length,
        total: manualRows.length + paymentAlerts.length + drawAlerts.length
      }
    });
  } catch (error) {
    console.error('getReminders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load reminders' });
  }
}

// ─── CREATE reminder ───
export async function createReminder(req, res) {
  try {
    const { title, description, due_date, reminder_type, committee_id } = req.body;
    const userId = req.user.id;

    if (!title || title.trim().length === 0) {
      return res.status(422).json({ success: false, message: 'Reminder title is required' });
    }
    if (title.trim().length > 255) {
      return res.status(422).json({ success: false, message: 'Title is too long (max 255 chars)' });
    }

    // Validate date format if provided
    if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return res.status(422).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const validTypes = ['payment', 'draw', 'custom', 'urgent'];
    const safeType = validTypes.includes(reminder_type) ? reminder_type : 'custom';

    // Decode committee_id hash if provided
    let numericCommitteeId = null;
    if (committee_id) {
      numericCommitteeId = typeof committee_id === 'string' && !/^\d+$/.test(committee_id)
        ? decodeId(committee_id)
        : parseInt(committee_id, 10);
    }

    const [result] = await pool.query(`
      INSERT INTO reminders (title, description, due_date, reminder_type, committee_id, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `, [
      title.trim(),
      description?.trim() || null,
      due_date || null,
      safeType,
      numericCommitteeId,
      userId
    ]);

    return res.status(201).json({
      success: true,
      message: 'Reminder created successfully!',
      id: encodeId(result.insertId)
    });
  } catch (error) {
    console.error('createReminder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create reminder' });
  }
}

// ─── MARK reminder as done ───
export async function markReminderDone(req, res) {
  try {
    const { id } = req.params;
    const numericId = typeof id === 'string' && !/^\d+$/.test(id) ? decodeId(id) : parseInt(id, 10);

    if (!numericId) {
      return res.status(400).json({ success: false, message: 'Invalid reminder ID' });
    }

    await pool.query(
      "UPDATE reminders SET status = 'done', updated_at = NOW() WHERE id = ?",
      [numericId]
    );

    return res.json({ success: true, message: 'Reminder marked as done!' });
  } catch (error) {
    console.error('markReminderDone error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update reminder' });
  }
}

// ─── DELETE reminder ───
export async function deleteReminder(req, res) {
  try {
    const { id } = req.params;
    const numericId = typeof id === 'string' && !/^\d+$/.test(id) ? decodeId(id) : parseInt(id, 10);

    if (!numericId) {
      return res.status(400).json({ success: false, message: 'Invalid reminder ID' });
    }

    await pool.query('DELETE FROM reminders WHERE id = ?', [numericId]);

    return res.json({ success: true, message: 'Reminder deleted!' });
  } catch (error) {
    console.error('deleteReminder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete reminder' });
  }
}
