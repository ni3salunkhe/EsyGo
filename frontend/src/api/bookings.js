import { apiClient, ApiError } from './client.js';

/**
 * Reserve a room and initiate a 10-minute hold.
 * POST /api/bookings
 *
 * @param {Object} payload
 * @param {number} payload.hotelId
 * @param {string} payload.checkIn - ISO date YYYY-MM-DD
 * @param {string} payload.checkOut - ISO date YYYY-MM-DD
 * @param {string} payload.guestName
 * @param {string} payload.guestEmail
 * @returns {Promise<Object>} BookingResponse (status: "HELD")
 */
export async function reserveBooking(payload) {
  const { hotelId, checkIn, checkOut, guestName, guestEmail } = payload || {};

  if (!hotelId || !checkIn || !checkOut || !guestName || !guestEmail) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      'Missing required booking fields.',
      [
        ...(!hotelId ? [{ field: 'hotelId', message: 'Hotel is required' }] : []),
        ...(!checkIn ? [{ field: 'checkIn', message: 'Check-in date is required' }] : []),
        ...(!checkOut ? [{ field: 'checkOut', message: 'Check-out date is required' }] : []),
        ...(!guestName ? [{ field: 'guestName', message: 'Guest name is required' }] : []),
        ...(!guestEmail ? [{ field: 'guestEmail', message: 'Guest email is required' }] : [])
      ]
    );
  }

  return await apiClient('/api/bookings', {
    method: 'POST',
    body: JSON.stringify({
      hotelId: Number(hotelId),
      checkIn: checkIn.trim(),
      checkOut: checkOut.trim(),
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim()
    })
  });
}

/**
 * Confirm a held booking following successful simulated demo payment.
 * POST /api/bookings/{reference}/confirm
 *
 * @param {string} reference - Booking reference e.g. HB-123456
 * @param {Object} payload
 * @param {string} payload.email - Registered guest email
 * @returns {Promise<Object>} BookingResponse (status: "CONFIRMED")
 */
export async function confirmBooking(reference, payload) {
  if (!reference || !reference.trim()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Booking reference is required.');
  }
  const email = payload?.email?.trim();
  if (!email) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Registered email is required for confirmation.');
  }

  return await apiClient(`/api/bookings/${encodeURIComponent(reference.trim())}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

/**
 * Retrieve booking details by reference and registered email.
 * GET /api/bookings/{reference}?email=...
 *
 * @param {string} reference
 * @param {string} email
 * @returns {Promise<Object>} BookingResponse
 */
export async function getBooking(reference, email) {
  if (!reference || !reference.trim()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Booking reference is required.');
  }
  if (!email || !email.trim()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Guest email is required.');
  }

  const queryParams = new URLSearchParams({ email: email.trim() });
  return await apiClient(`/api/bookings/${encodeURIComponent(reference.trim())}?${queryParams.toString()}`);
}

/**
 * Cancel a booking (must be confirmed and check-in date in the future).
 * POST /api/bookings/{reference}/cancel
 *
 * @param {string} reference
 * @param {Object} payload
 * @param {string} payload.email
 * @returns {Promise<Object>} BookingResponse (status: "CANCELLED")
 */
export async function cancelBooking(reference, payload) {
  if (!reference || !reference.trim()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Booking reference is required.');
  }
  const email = payload?.email?.trim();
  if (!email) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Guest email is required.');
  }

  return await apiClient(`/api/bookings/${encodeURIComponent(reference.trim())}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}
