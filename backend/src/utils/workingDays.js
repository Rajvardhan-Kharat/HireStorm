'use strict';

/**
 * workingDays.js
 * ──────────────
 * Utility for calculating working days while skipping:
 *   • Saturdays and Sundays
 *   • A hardcoded list of Indian National Holidays (current + next year)
 *
 * Usage:
 *   const { add90WorkingDays, countWorkingDaysBetween } = require('../utils/workingDays');
 */

// ── Indian National Holidays (YYYY-MM-DD) ─────────────────────────────────────
// Covers Republic Day, Independence Day, Gandhi Jayanti + major gazetted holidays.
// Extend this list each year as required.
const INDIAN_HOLIDAYS = new Set([
  // 2025
  '2025-01-26', // Republic Day
  '2025-03-14', // Holi
  '2025-04-14', // Dr. Ambedkar Jayanti / Tamil New Year
  '2025-04-18', // Good Friday
  '2025-05-12', // Buddha Purnima
  '2025-06-07', // Eid al-Adha (approx)
  '2025-07-06', // Muharram (approx)
  '2025-08-15', // Independence Day
  '2025-09-05', // Janmashtami (approx)
  '2025-10-02', // Gandhi Jayanti
  '2025-10-02', // Dussehra (may coincide)
  '2025-10-20', // Diwali (approx)
  '2025-11-05', // Diwali Padwa (approx)
  '2025-11-15', // Guru Nanak Jayanti (approx)
  '2025-12-25', // Christmas

  // 2026
  '2026-01-26', // Republic Day
  '2026-03-03', // Holi (approx)
  '2026-04-03', // Good Friday (approx)
  '2026-04-14', // Dr. Ambedkar Jayanti
  '2026-05-01', // Eid ul-Fitr (approx)
  '2026-08-15', // Independence Day
  '2026-10-02', // Gandhi Jayanti
  '2026-10-21', // Dussehra (approx)
  '2026-11-09', // Diwali (approx)
  '2026-12-25', // Christmas
]);

/**
 * Returns true if the given Date is a working day.
 * @param {Date} date
 * @returns {boolean}
 */
const isWorkingDay = (date) => {
  const day = date.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;

  const iso = date.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  if (INDIAN_HOLIDAYS.has(iso)) return false;

  return true;
};

/**
 * add90WorkingDays
 * ────────────────
 * Given a startDate, returns the Date exactly 90 working days later
 * (ignoring weekends and Indian holidays).
 *
 * @param {Date|string} startDate
 * @returns {Date}
 */
const add90WorkingDays = (startDate) => {
  const date = new Date(startDate);
  date.setHours(0, 0, 0, 0);

  let workingDaysCount = 0;

  while (workingDaysCount < 90) {
    date.setDate(date.getDate() + 1);
    if (isWorkingDay(date)) {
      workingDaysCount++;
    }
  }

  return date;
};

/**
 * countWorkingDaysBetween
 * ───────────────────────
 * Counts the number of working days elapsed between startDate and today
 * (or an optional toDate). Useful for triggering the 30-day monthly reviews.
 *
 * @param {Date|string} startDate
 * @param {Date|string} [toDate=new Date()]
 * @returns {number}
 */
const countWorkingDaysBetween = (startDate, toDate = new Date()) => {
  const from = new Date(startDate);
  const to   = new Date(toDate);
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);

  let count = 0;
  const cursor = new Date(from);

  while (cursor < to) {
    cursor.setDate(cursor.getDate() + 1);
    if (isWorkingDay(cursor)) count++;
  }

  return count;
};

module.exports = { isWorkingDay, add90WorkingDays, countWorkingDaysBetween };
