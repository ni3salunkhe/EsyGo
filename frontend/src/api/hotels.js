import { apiClient, ApiError } from './client.js';

/**
 * Normalizes a raw hotel response from the backend.
 * Ensures `images: string[]` is always present and strictly respects the backend's
 * `display_order ASC` ordering without arbitrary sorting.
 * Preserves 100% backward compatibility with `imageUrl` by assigning `images[0]`.
 *
 * @param {Object} hotel - Raw HotelResponse from backend
 * @returns {Object} Normalized hotel with both `images` array and `imageUrl` string
 */
export function normalizeHotel(hotel) {
  if (!hotel || typeof hotel !== 'object') return hotel;

  let images = [];
  if (Array.isArray(hotel.images)) {
    // Retain exact backend display_order ASC sequence; filter non-empty strings
    images = hotel.images.filter((img) => typeof img === 'string' && img.trim().length > 0);
  } else if (hotel.imageUrl && typeof hotel.imageUrl === 'string' && hotel.imageUrl.trim().length > 0) {
    images = [hotel.imageUrl.trim()];
  }

  // Primary image is images[0], falling back to existing imageUrl or null
  const primaryImage = images.length > 0 ? images[0] : (hotel.imageUrl || null);

  return {
    ...hotel,
    images,
    imageUrl: primaryImage,
  };
}

/**
 * Fetch hotels in browse mode (no dates) or search mode (both dates present).
 * If only one date is provided, rejects early with VALIDATION_ERROR to prevent invalid backend 400.
 *
 * @param {Object} [params={}]
 * @param {string} [params.location] - Exact location string (case-insensitive on backend)
 * @param {string} [params.checkIn] - ISO date YYYY-MM-DD
 * @param {string} [params.checkOut] - ISO date YYYY-MM-DD
 * @returns {Promise<Array>} List of normalized HotelResponse objects
 */
export async function getHotels(params = {}) {
  const { location, checkIn, checkOut } = params;

  // Single date guard per contract
  if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      'Both check-in and check-out dates must be provided together.',
      [{ field: !checkIn ? 'checkIn' : 'checkOut', message: 'Both check-in and check-out dates are required' }]
    );
  }

  const queryParams = new URLSearchParams();
  if (location && location.trim()) {
    queryParams.set('location', location.trim());
  }
  if (checkIn && checkOut) {
    queryParams.set('checkIn', checkIn);
    queryParams.set('checkOut', checkOut);
  }

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/api/hotels?${queryString}` : '/api/hotels';

  const data = await apiClient(endpoint);
  return Array.isArray(data) ? data.map(normalizeHotel) : [];
}

/**
 * Fetch detailed hotel information by ID, optionally evaluating date-specific availability.
 *
 * @param {number|string} hotelId
 * @param {Object} [dates={}]
 * @param {string} [dates.checkIn] - ISO date YYYY-MM-DD
 * @param {string} [dates.checkOut] - ISO date YYYY-MM-DD
 * @returns {Promise<Object>} Normalized HotelResponse object (availableRooms may be 0 if sold out)
 */
export async function getHotelDetail(hotelId, dates = {}) {
  if (!hotelId) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Hotel ID is required.');
  }

  const { checkIn, checkOut } = dates;
  if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      'Both check-in and check-out dates must be provided together.',
      [{ field: !checkIn ? 'checkIn' : 'checkOut', message: 'Both check-in and check-out dates are required' }]
    );
  }

  const queryParams = new URLSearchParams();
  if (checkIn && checkOut) {
    queryParams.set('checkIn', checkIn);
    queryParams.set('checkOut', checkOut);
  }

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/api/hotels/${hotelId}?${queryString}` : `/api/hotels/${hotelId}`;

  const data = await apiClient(endpoint);
  return normalizeHotel(data);
}
