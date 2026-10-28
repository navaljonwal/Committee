import pool from '../config/db.js';
import { getTodayDateStr, addDaysToDate } from '../utils/dateUtils.js';

/**
 * ChitFund / Kameti Late Penalty Engine
 * 
 * Rules:
 * - A schedule round has a Draw / Bidding Date (draw_date).
 * - Members have a grace period (e.g. 5 days, configurable per committee via payment_grace_days).
 * - Due Date = draw_date + payment_grace_days.
 * - If today > Due Date and payment is still pending, late penalty (e.g. ₹100 per seat,
 *   configurable via late_penalty_amount) is automatically applied.
 * - If admin manually edits or waives penalty, is_penalty_manual = 1 prevents auto-overwriting.
 */

/**
 * Apply auto-penalties for a single schedule round
 * @param {number|string} scheduleId 
 * @param {object} db - pool or connection
 * @returns {Promise<object>}
 */
export async function applyAutoPenaltiesForSchedule(scheduleId, db = pool) {
  try {
    const [rows] = await db.query(`
      SELECT 
        cs.id, 
        cs.draw_date, 
        cs.month_no, 
        c.id as committee_id, 
        c.status as committee_status,
        COALESCE(c.payment_grace_days, 5) as payment_grace_days,
        COALESCE(c.late_penalty_amount, 100.00) as late_penalty_amount
      FROM committee_schedules cs
      JOIN committees c ON cs.committee_id = c.id
      WHERE cs.id = ?
    `, [scheduleId]);

    if (rows.length === 0) return { updated: 0, isOverdue: false };
    const sched = rows[0];

    // Completed committees are locked
    if (sched.committee_status === 'completed' || !sched.draw_date) {
      return { updated: 0, isOverdue: false, dueDate: null };
    }

    const graceDays = parseInt(sched.payment_grace_days || 5, 10);
    const penaltyPerSeat = parseFloat(sched.late_penalty_amount || 100.00);
    const dueDateStr = addDaysToDate(sched.draw_date, graceDays);
    const todayStr = getTodayDateStr();

    const isOverdue = todayStr > dueDateStr;

    if (isOverdue) {
      // Apply penalty to all pending payments where penalty has not been manually edited
      const [result] = await db.query(`
        UPDATE committee_member_payments
        SET penalty_amount = ?,
            remarks = COALESCE(NULLIF(remarks, ''), 'Auto late penalty (Grace period over)'),
            updated_at = NOW()
        WHERE schedule_id = ?
          AND payment_status = 'pending'
          AND is_penalty_manual = 0
          AND penalty_amount = 0
      `, [penaltyPerSeat, scheduleId]);

      return {
        updated: result.affectedRows,
        dueDate: dueDateStr,
        drawDate: sched.draw_date,
        graceDays,
        penaltyPerSeat,
        isOverdue: true
      };
    } else {
      // Within grace period: revert any auto-applied penalty if draw_date was moved forward
      const [result] = await db.query(`
        UPDATE committee_member_payments
        SET penalty_amount = 0.00,
            remarks = NULL,
            updated_at = NOW()
        WHERE schedule_id = ?
          AND payment_status = 'pending'
          AND is_penalty_manual = 0
          AND penalty_amount > 0
          AND (remarks LIKE 'Auto late penalty%' OR remarks IS NULL)
      `, [scheduleId]);

      return {
        updated: result.affectedRows,
        dueDate: dueDateStr,
        drawDate: sched.draw_date,
        graceDays,
        penaltyPerSeat,
        isOverdue: false
      };
    }
  } catch (error) {
    console.error('applyAutoPenaltiesForSchedule error:', error.message);
    return { updated: 0, error: error.message };
  }
}

/**
 * Global auto-penalty check for all active committees
 * Called before fetching reminders or member dashboard
 * @param {object} db - pool or connection
 * @returns {Promise<object>}
 */
export async function applyAutoPenaltiesGlobal(db = pool) {
  try {
    // 1. Auto-apply penalty to overdue pending payments
    const [applyResult] = await db.query(`
      UPDATE committee_member_payments cmp
      JOIN committee_schedules cs ON cmp.schedule_id = cs.id
      JOIN committees c ON cs.committee_id = c.id
      SET cmp.penalty_amount = COALESCE(c.late_penalty_amount, 100.00),
          cmp.remarks = COALESCE(NULLIF(cmp.remarks, ''), 'Auto late penalty (Grace period over)'),
          cmp.updated_at = NOW()
      WHERE c.status = 'active'
        AND cmp.payment_status = 'pending'
        AND cmp.is_penalty_manual = 0
        AND cmp.penalty_amount = 0
        AND cs.draw_date IS NOT NULL
        AND CURDATE() > DATE_ADD(cs.draw_date, INTERVAL COALESCE(c.payment_grace_days, 5) DAY)
    `);

    // 2. Revert auto penalties if draw date was extended / moved to future
    const [revertResult] = await db.query(`
      UPDATE committee_member_payments cmp
      JOIN committee_schedules cs ON cmp.schedule_id = cs.id
      JOIN committees c ON cs.committee_id = c.id
      SET cmp.penalty_amount = 0.00,
          cmp.remarks = NULL,
          cmp.updated_at = NOW()
      WHERE c.status = 'active'
        AND cmp.payment_status = 'pending'
        AND cmp.is_penalty_manual = 0
        AND cmp.penalty_amount > 0
        AND (cmp.remarks LIKE 'Auto late penalty%' OR cmp.remarks IS NULL)
        AND cs.draw_date IS NOT NULL
        AND CURDATE() <= DATE_ADD(cs.draw_date, INTERVAL COALESCE(c.payment_grace_days, 5) DAY)
    `);

    return {
      applied: applyResult.affectedRows || 0,
      reverted: revertResult.affectedRows || 0
    };
  } catch (error) {
    console.error('applyAutoPenaltiesGlobal error:', error.message);
    return { error: error.message };
  }
}
