/**
 * ChitFund / Kameti Formula Engine
 * Replicates the exact mathematical formulas and payment synchronization from Laravel Committee.php
 */

export function addMonthsToDate(dateStrOrObj, monthsToAdd) {
  if (!dateStrOrObj) return null;

  if (typeof dateStrOrObj === 'string') {
    const match = dateStrOrObj.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1 + monthsToAdd;
      const day = parseInt(match[3], 10);

      const d = new Date(Date.UTC(year, month, day));
      if (d.getUTCDate() !== day) {
        d.setUTCDate(0);
      }
      return d.toISOString().split('T')[0];
    }
  }

  if (dateStrOrObj instanceof Date && !isNaN(dateStrOrObj.getTime())) {
    try {
      const istStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(dateStrOrObj);
      return addMonthsToDate(istStr, monthsToAdd);
    } catch {
      const year = dateStrOrObj.getFullYear();
      const month = String(dateStrOrObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateStrOrObj.getDate()).padStart(2, '0');
      return addMonthsToDate(`${year}-${month}-${day}`, monthsToAdd);
    }
  }

  const d = new Date(dateStrOrObj);
  if (isNaN(d.getTime())) return null;
  const currentDay = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + monthsToAdd);
  if (d.getUTCDate() !== currentDay) {
    d.setUTCDate(0);
  }
  return d.toISOString().split('T')[0];
}

export function calculatePreviewRows(totalAmount, totalMembers, deductionRate, specialMonthIndex, startDateStr) {
  const v = parseFloat(totalAmount) || 0;
  const m = parseInt(totalMembers, 10) || 0;
  const r = parseFloat(deductionRate) || 0;
  const specialIndex = parseInt(specialMonthIndex, 10);
  
  if (m <= 0) return { error: 'Total members must be greater than 0' };

  const baseUnit = (v * r) / 100;
  const rows = [];
  let totalDeductionSum = 0;
  let totalNetPayoutSum = 0;

  for (let month = 1; month <= m; month++) {
    const indexN = m - month + 1;
    const isSpecial = (indexN === specialIndex);
    const deduction = isSpecial ? 0.0 : (indexN * baseUnit);
    const netPayout = v - deduction;
    const kist = netPayout / m;

    totalDeductionSum += deduction;
    totalNetPayoutSum += netPayout;

    const drawDate = startDateStr ? addMonthsToDate(startDateStr, month - 1) : null;

    rows.push({
      month_no: month,
      index_n: indexN,
      is_special: isSpecial,
      deduction_amount: parseFloat(deduction.toFixed(2)),
      net_payout: parseFloat(netPayout.toFixed(2)),
      installment_per_member: parseFloat(kist.toFixed(2)),
      draw_date: drawDate,
    });
  }

  const totalMemberContribution = totalNetPayoutSum / m;

  return {
    base_unit: parseFloat(baseUnit.toFixed(2)),
    rows,
    total_deduction_sum: parseFloat(totalDeductionSum.toFixed(2)),
    total_net_payout_sum: parseFloat(totalNetPayoutSum.toFixed(2)),
    total_member_contribution: parseFloat(totalMemberContribution.toFixed(2)),
    total_pool_collected: parseFloat(totalNetPayoutSum.toFixed(2)),
  };
}

/**
 * Generate schedules for a newly created committee
 */
export async function generateSchedules(committeeId, conn) {
  const [committees] = await conn.query('SELECT * FROM committees WHERE id = ?', [committeeId]);
  if (committees.length === 0) return;

  const committee = committees[0];
  const [existingSchedules] = await conn.query('SELECT id FROM committee_schedules WHERE committee_id = ?', [committeeId]);

  if (existingSchedules.length > 0) {
    await syncMemberPayments(committeeId, conn);
    return;
  }

  const v = parseFloat(committee.total_amount);
  const m = parseInt(committee.total_members, 10);
  const r = parseFloat(committee.deduction_rate);
  const specialIndex = parseInt(committee.special_month_index, 10);
  const baseUnit = (v * r) / 100;

  const scheduleValues = [];
  const now = new Date();

  for (let month = 1; month <= m; month++) {
    const indexN = m - month + 1;
    const deduction = (indexN === specialIndex) ? 0.0 : (indexN * baseUnit);
    const netPayout = v - deduction;
    const kist = netPayout / m;
    const drawDate = committee.start_date ? addMonthsToDate(committee.start_date, month - 1) : null;

    scheduleValues.push([
      committeeId,
      month,
      indexN,
      deduction,
      null, // custom_deduction_amount
      false, // is_custom_bid
      netPayout,
      kist,
      null, // member_id (winner)
      drawDate,
      'unpaid', // payout_status
      now,
      now
    ]);
  }

  if (scheduleValues.length > 0) {
    await conn.query(`
      INSERT INTO committee_schedules 
      (committee_id, month_no, index_n, deduction_amount, custom_deduction_amount, is_custom_bid, net_payout, installment_per_member, member_id, draw_date, payout_status, created_at, updated_at)
      VALUES ?
    `, [scheduleValues]);
  }

  await syncMemberPayments(committeeId, conn);
}

/**
 * Re-synchronize member payment rows for a committee
 */
export async function syncMemberPayments(committeeId, conn) {
  const [currentMembers] = await conn.query(
    'SELECT m.id, cm.seats FROM members m INNER JOIN committee_member cm ON m.id = cm.member_id WHERE cm.committee_id = ?',
    [committeeId]
  );

  const currentMemberIds = currentMembers.map(m => m.id);
  const [schedules] = await conn.query(
    'SELECT id, month_no, installment_per_member FROM committee_schedules WHERE committee_id = ? ORDER BY month_no ASC',
    [committeeId]
  );

  if (schedules.length === 0 || currentMemberIds.length === 0) return;

  const scheduleIds = schedules.map(s => s.id);

  // 1. Bulk remove pending payments for members who are no longer in this committee
  await conn.query(
    'DELETE FROM committee_member_payments WHERE schedule_id IN (?) AND member_id NOT IN (?) AND payment_status = ?',
    [scheduleIds, currentMemberIds, 'pending']
  );

  // 2. Fetch existing payment rows
  const [existingRecords] = await conn.query(`
    SELECT id, schedule_id, member_id, seat_no, payment_status 
    FROM committee_member_payments 
    WHERE schedule_id IN (?) 
    ORDER BY CASE WHEN payment_status = 'paid' THEN 0 ELSE 1 END, id ASC
  `, [scheduleIds]);

  const existingLookup = new Set();
  const excessIdsToDelete = [];

  const memberSeatsMap = {};
  for (const m of currentMembers) {
    memberSeatsMap[m.id] = parseInt(m.seats || 1, 10);
  }

  for (const rec of existingRecords) {
    const key = `${rec.schedule_id}_${rec.member_id}_${rec.seat_no}`;
    if (existingLookup.has(key)) {
      if (rec.payment_status === 'pending') {
        excessIdsToDelete.push(rec.id);
        continue;
      }
    }
    existingLookup.add(key);

    const maxSeats = memberSeatsMap[rec.member_id] || 1;
    if (rec.seat_no > maxSeats && rec.payment_status === 'pending') {
      excessIdsToDelete.push(rec.id);
    }
  }

  if (excessIdsToDelete.length > 0) {
    await conn.query('DELETE FROM committee_member_payments WHERE id IN (?)', [excessIdsToDelete]);
  }

  // 3. Insert missing rows
  const now = new Date();
  const newPayments = [];

  for (const sched of schedules) {
    for (const m of currentMembers) {
      const seatsCount = memberSeatsMap[m.id] || 1;
      for (let seatNo = 1; seatNo <= seatsCount; seatNo++) {
        const key = `${sched.id}_${m.id}_${seatNo}`;
        if (!existingLookup.has(key)) {
          newPayments.push([
            sched.id,
            m.id,
            seatNo,
            sched.installment_per_member,
            0, // penalty_amount
            null, // remarks
            'pending',
            null, // payment_date
            now,
            now
          ]);
          existingLookup.add(key);
        }
      }
    }
  }

  if (newPayments.length > 0) {
    // Chunk insert by 250 rows
    for (let i = 0; i < newPayments.length; i += 250) {
      const chunk = newPayments.slice(i, i + 250);
      await conn.query(`
        INSERT INTO committee_member_payments 
        (schedule_id, member_id, seat_no, amount_paid, penalty_amount, remarks, payment_status, payment_date, created_at, updated_at)
        VALUES ?
      `, [chunk]);
    }
  }
}

/**
 * Recalculate schedule entries and draw dates
 */
export async function recalculateSchedules(committeeId, conn) {
  const [committees] = await conn.query('SELECT * FROM committees WHERE id = ?', [committeeId]);
  if (committees.length === 0) return;

  const committee = committees[0];
  const v = parseFloat(committee.total_amount);
  const m = parseInt(committee.total_members, 10);
  const r = parseFloat(committee.deduction_rate);
  const specialIndex = parseInt(committee.special_month_index, 10);
  const baseUnit = (v * r) / 100;
  const startDate = committee.start_date ? new Date(committee.start_date) : null;

  const [existingSchedules] = await conn.query(
    'SELECT * FROM committee_schedules WHERE committee_id = ? ORDER BY month_no ASC',
    [committeeId]
  );

  const existingCount = existingSchedules.length;
  const now = new Date();

  // If total members M increased
  if (existingCount < m) {
    const newScheds = [];
    for (let month = existingCount + 1; month <= m; month++) {
      const indexN = m - month + 1;
      const deduction = (indexN === specialIndex) ? 0.0 : (indexN * baseUnit);
      const netPayout = v - deduction;
      const kist = netPayout / m;
      const drawDate = startDate ? addMonthsToDate(startDate, month - 1) : null;

      newScheds.push([
        committeeId,
        month,
        indexN,
        deduction,
        null,
        false,
        netPayout,
        kist,
        null,
        drawDate,
        'unpaid',
        now,
        now
      ]);
    }

    if (newScheds.length > 0) {
      await conn.query(`
        INSERT INTO committee_schedules 
        (committee_id, month_no, index_n, deduction_amount, custom_deduction_amount, is_custom_bid, net_payout, installment_per_member, member_id, draw_date, payout_status, created_at, updated_at)
        VALUES ?
      `, [newScheds]);
    }
  }

  // Update existing schedules
  const [allSchedules] = await conn.query(
    'SELECT * FROM committee_schedules WHERE committee_id = ? ORDER BY month_no ASC',
    [committeeId]
  );

  for (const sched of allSchedules) {
    const month = sched.month_no;
    const indexN = m - month + 1;
    const drawDate = startDate ? addMonthsToDate(startDate, month - 1) : null;

    let deduction;
    if (sched.is_custom_bid && sched.custom_deduction_amount !== null) {
      deduction = parseFloat(sched.custom_deduction_amount);
    } else {
      const isSpecial = (indexN === specialIndex);
      deduction = isSpecial ? 0.0 : (indexN * baseUnit);
    }

    const netPayout = v - deduction;
    const kistPerMember = netPayout / m;

    await conn.query(`
      UPDATE committee_schedules 
      SET index_n = ?, deduction_amount = ?, net_payout = ?, installment_per_member = ?, draw_date = ?, updated_at = NOW()
      WHERE id = ?
    `, [indexN, deduction, netPayout, kistPerMember, drawDate, sched.id]);

    // Update pending payments installment
    await conn.query(`
      UPDATE committee_member_payments 
      SET amount_paid = ?, updated_at = NOW()
      WHERE schedule_id = ? AND payment_status = 'pending'
    `, [kistPerMember, sched.id]);
  }

  await syncMemberPayments(committeeId, conn);
}
