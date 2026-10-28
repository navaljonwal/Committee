/**
 * Date Utility for Indian Standard Time (Asia/Kolkata)
 * Guarantees date calculations align with the user's timezone (IST) regardless of server UTC time.
 */

export function getTodayDateStr() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export function formatDbDate(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    const match = val.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(val);
    } catch {
      const year = val.getFullYear();
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const day = String(val.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return String(val).split('T')[0];
}

/**
 * Add days to a date string (YYYY-MM-DD) or Date object safely
 * @param {string|Date} dateStrOrObj 
 * @param {number} daysToAdd 
 * @returns {string|null} YYYY-MM-DD
 */
export function addDaysToDate(dateStrOrObj, daysToAdd) {
  const formatted = formatDbDate(dateStrOrObj);
  if (!formatted) return null;
  const match = formatted.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10) - 1;
  const d = parseInt(match[3], 10);

  const date = new Date(Date.UTC(y, m, d + daysToAdd));
  return date.toISOString().split('T')[0];
}

/**
 * Difference in days between two date strings (date2 - date1)
 * Positive if date2 is in the future relative to date1
 * @param {string|Date} date1 
 * @param {string|Date} date2 
 * @returns {number|null}
 */
export function getDaysDifference(date1, date2) {
  const d1Str = formatDbDate(date1);
  const d2Str = formatDbDate(date2);
  if (!d1Str || !d2Str) return null;

  const [y1, m1, day1] = d1Str.split('-').map(Number);
  const [y2, m2, day2] = d2Str.split('-').map(Number);

  const utc1 = Date.UTC(y1, m1 - 1, day1);
  const utc2 = Date.UTC(y2, m2 - 1, day2);

  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}
