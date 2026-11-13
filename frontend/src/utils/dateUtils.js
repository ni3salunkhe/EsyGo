/**
 * Date utility helpers strictly adhering to Asia/Kolkata time zone and validation invariants.
 */

/**
 * Returns today's date formatted as YYYY-MM-DD in Asia/Kolkata timezone.
 * @returns {string}
 */
export function getTodayString() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

/**
 * Calculates the number of whole nights between check-in and check-out.
 * Stay interval is half-open [checkIn, checkOut).
 * @param {string} checkIn - YYYY-MM-DD
 * @param {string} checkOut - YYYY-MM-DD
 * @returns {number}
 */
export function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn + 'T00:00:00Z');
  const end = new Date(checkOut + 'T00:00:00Z');
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Returns the maximum allowed check-out date (checkIn + 30 nights or today + 365 days, whichever is earlier).
 * @param {string} checkIn - YYYY-MM-DD
 * @returns {string}
 */
export function getMaxCheckOutDate(checkIn) {
  if (!checkIn) return getMaxAdvanceDate();
  const start = new Date(checkIn + 'T00:00:00Z');
  const maxStay = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  const maxAdvance = new Date(new Date(getTodayString() + 'T00:00:00Z').getTime() + 365 * 24 * 60 * 60 * 1000);

  const target = maxStay < maxAdvance ? maxStay : maxAdvance;
  return target.toISOString().split('T')[0];
}

/**
 * Returns today + 365 days in YYYY-MM-DD.
 * @returns {string}
 */
export function getMaxAdvanceDate() {
  const today = new Date(getTodayString() + 'T00:00:00Z');
  const maxDate = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
  return maxDate.toISOString().split('T')[0];
}

/**
 * Formats a YYYY-MM-DD date into human-readable text (e.g., "Mon, 15 Dec 2026").
 * @param {string} dateString
 * @returns {string}
 */
export function formatDisplayDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00Z');
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Validates check-in and check-out dates.
 * Returns an error message string if invalid, or null if valid.
 * @param {string} checkIn
 * @param {string} checkOut
 * @returns {string|null}
 */
export function validateDates(checkIn, checkOut) {
  if (!checkIn && !checkOut) return null; // Browse mode
  if (checkIn && !checkOut) return 'Please select a check-out date.';
  if (!checkIn && checkOut) return 'Please select a check-in date.';

  const today = getTodayString();
  if (checkIn < today) {
    return 'Check-in date cannot be in the past.';
  }
  if (checkOut <= checkIn) {
    return 'Check-out date must be after check-in date.';
  }

  const nights = calculateNights(checkIn, checkOut);
  if (nights > 30) {
    return 'Maximum stay duration is 30 nights.';
  }

  const maxAdvance = getMaxAdvanceDate();
  if (checkOut > maxAdvance) {
    return 'Reservations can only be made up to 365 days in advance.';
  }

  return null;
}
