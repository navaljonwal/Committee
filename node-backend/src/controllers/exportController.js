import pool from '../config/db.js';
import { addMonthsToDate } from '../services/formula.js';

export async function exportCsv(req, res) {
  try {
    const { id } = req.params;

    const [committees] = await pool.query('SELECT * FROM committees WHERE id = ?', [id]);
    if (committees.length === 0) {
      return res.status(404).send('Committee not found');
    }
    const committee = committees[0];

    const [schedules] = await pool.query(`
      SELECT 
        cs.*,
        m.name as winner_name 
      FROM committee_schedules cs
      LEFT JOIN members m ON cs.member_id = m.id
      WHERE cs.committee_id = ?
      ORDER BY cs.month_no ASC
    `, [id]);

    const filename = `Committee_${committee.name.replace(/\s+/g, '_')}_Schedule.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'must-revalidate, post-check=0, pre-check=0');

    const lines = [];
    const escapeCsv = (str) => {
      const s = String(str ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const formatInr = (num) => parseFloat(num || 0).toFixed(2);

    const startDateStr = committee.start_date 
      ? new Date(committee.start_date).toISOString().split('T')[0] 
      : 'N/A';

    const lastSchedule = schedules[schedules.length - 1];
    const endDateStr = lastSchedule?.draw_date
      ? new Date(lastSchedule.draw_date).toISOString().split('T')[0]
      : (committee.start_date ? addMonthsToDate(committee.start_date, committee.total_members - 1) : 'N/A');

    // Header info
    lines.push([escapeCsv('Committee Name:'), escapeCsv(committee.name)].join(','));
    lines.push([escapeCsv('Chit Amount (V):'), escapeCsv(`INR ${formatInr(committee.total_amount)}`)].join(','));
    lines.push([escapeCsv('Total Members (M):'), escapeCsv(committee.total_members)].join(','));
    lines.push([escapeCsv('Deduction Rate (%):'), escapeCsv(`${committee.deduction_rate}%`)].join(','));
    lines.push([escapeCsv('Start Date:'), escapeCsv(startDateStr)].join(','));
    lines.push([escapeCsv('End Date (Maturity):'), escapeCsv(endDateStr)].join(','));
    lines.push('');

    // Table Headers
    lines.push([
      'Month / Kisht No.',
      'Formula Multiplier (N)',
      'Total Deduction (INR)',
      'Winner Payout Amount (INR)',
      'Monthly Installment (Kist) Per Member (INR)',
      'Status / Winner',
      'Estimated Draw Date'
    ].map(escapeCsv).join(','));

    let totalDeductions = 0;
    let totalNetPayout = 0;
    let totalKist = 0;

    for (const s of schedules) {
      const isSpecial = (s.index_n === parseInt(committee.special_month_index, 10));
      let tag = '';
      if (s.is_custom_bid) {
        tag = ' [AUCTION BID DEDUCTION]';
      } else if (isSpecial) {
        tag = ' [ZERO DEDUCTION / SPECIAL MONTH]';
      }

      totalDeductions += parseFloat(s.deduction_amount || 0);
      totalNetPayout += parseFloat(s.net_payout || 0);
      totalKist += parseFloat(s.installment_per_member || 0);

      const drawDateFormatted = s.draw_date
        ? new Date(s.draw_date).toISOString().split('T')[0]
        : 'N/A';

      lines.push([
        `Month ${s.month_no}${tag}`,
        s.index_n,
        formatInr(s.deduction_amount),
        formatInr(s.net_payout),
        formatInr(s.installment_per_member),
        s.winner_name || 'Pending Draw',
        drawDateFormatted
      ].map(escapeCsv).join(','));
    }

    // Totals row
    lines.push('');
    lines.push([
      'GRAND TOTALS',
      '-',
      formatInr(totalDeductions),
      formatInr(totalNetPayout),
      formatInr(totalKist),
      `Total Member Contribution: INR ${formatInr(totalKist)}`,
      '-'
    ].map(escapeCsv).join(','));

    return res.send(lines.join('\n'));
  } catch (error) {
    return res.status(500).send(error.message);
  }
}
