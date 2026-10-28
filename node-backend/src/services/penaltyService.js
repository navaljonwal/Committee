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
        c.payment_grace_days,
        c.late_penalty_amount
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

    const graceDays = parseInt(sched.payment_grace_days !== undefined && sched.payment_grace_days !== null ? sched.payment_grace_days : 5, 10);
    const penaltyPerSeat = parseFloat(sched.late_penalty_amount !== undefined && sched.late_penalty_amount !== null ? sched.late_penalty_amount : 100.00);
    const dueDateStr = addDaysToDate(sched.draw_date, graceDays);
    const todayStr = getTodayDateStr();

    const isOverdue = todayStr > dueDateStr;

    if (isOverdue) {
      // Apply penalty to all pending payments where penalty has not been manually edited
      const [result] = await db.query(`
        UPDATE committee_member_payments
        SET penalty_amount = ?,
            remarks = 'Auto late penalty (Grace period over)',
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
 * Cross-database compatible (works smoothly on both MySQL and PostgreSQL)
 * @param {object} db - pool or connection
 * @returns {Promise<object>}
 */
export async function applyAutoPenaltiesGlobal(db = pool) {
  try {
    const todayStr = getTodayDateStr();

    // 1. Fetch active schedules that have a draw_date and pending payments
    const [schedules] = await db.query(`
      SELECT 
        cs.id as schedule_id,
        cs.draw_date,
        c.payment_grace_days,
        c.late_penalty_amount
      FROM committee_schedules cs
      JOIN committees c ON cs.committee_id = c.id
      WHERE c.status = 'active'
        AND cs.draw_date IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM committee_member_payments cmp 
          WHERE cmp.schedule_id = cs.id AND cmp.payment_status = 'pending'
        )
    `);

    if (!schedules || schedules.length === 0) {
      return { applied: 0, reverted: 0 };
    }

    let appliedCount = 0;
    let revertedCount = 0;

    for (const s of schedules) {
      const graceDays = parseInt(s.payment_grace_days !== undefined && s.payment_grace_days !== null ? s.payment_grace_days : 5, 10);
      const penaltyAmt = parseFloat(s.late_penalty_amount !== undefined && s.late_penalty_amount !== null ? s.late_penalty_amount : 100.00);
      const dueDate = addDaysToDate(s.draw_date, graceDays);

      if (todayStr > dueDate) {
        // Overdue: apply penalty to pending rows that haven't been manually edited
        const [res] = await db.query(`
          UPDATE committee_member_payments
          SET penalty_amount = ?,
              remarks = 'Auto late penalty (Grace period over)',
              updated_at = NOW()
          WHERE schedule_id = ?
            AND payment_status = 'pending'
            AND is_penalty_manual = 0
            AND penalty_amount = 0
        `, [penaltyAmt, s.schedule_id]);
        appliedCount += res.affectedRows || 0;
      } else {
        // Within grace period: revert any auto penalties if draw_date was moved
        const [res] = await db.query(`
          UPDATE committee_member_payments
          SET penalty_amount = 0.00,
              remarks = NULL,
              updated_at = NOW()
          WHERE schedule_id = ?
            AND payment_status = 'pending'
            AND is_penalty_manual = 0
            AND penalty_amount > 0
            AND (remarks LIKE 'Auto late penalty%' OR remarks IS NULL)
        `, [s.schedule_id]);
        revertedCount += res.affectedRows || 0;
      }
    }

    return { applied: appliedCount, reverted: revertedCount };
  } catch (error) {
    console.error('applyAutoPenaltiesGlobal error:', error.message);
    return { error: error.message };
  }
}
