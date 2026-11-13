import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from '../src/api/client.js';
import { getHotels, getHotelDetail } from '../src/api/hotels.js';
import { reserveBooking, confirmBooking, getBooking, cancelBooking } from '../src/api/bookings.js';

describe('API Foundation Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('apiClient', () => {
    it('returns parsed JSON for 200 OK responses', async () => {
      const mockData = [{ id: 1, name: 'The Taj Mahal Palace' }];
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => mockData,
      });

      const result = await apiClient('/api/hotels');
      expect(result).toEqual(mockData);
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/hotels', {
        headers: { Accept: 'application/json' }
      });
    });

    it('throws ApiError with backend code and fieldErrors on 400 Bad Request', async () => {
      const errorPayload = {
        timestamp: '2026-11-13T12:00:00Z',
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid dates',
        fieldErrors: [{ field: 'checkOut', message: 'checkOut must be after checkIn' }]
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: { get: () => 'application/json' },
        json: async () => errorPayload,
      });

      await expect(apiClient('/api/hotels?checkIn=2026-12-05')).rejects.toThrow(ApiError);
      try {
        await apiClient('/api/hotels?checkIn=2026-12-05');
      } catch (err) {
        expect(err.status).toBe(400);
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.message).toBe('Invalid dates');
        expect(err.fieldErrors).toHaveLength(1);
        expect(err.fieldErrors[0].field).toBe('checkOut');
      }
    });

    it('throws ApiError with code HOLD_EXPIRED on 409 Conflict', async () => {
      const errorPayload = {
        timestamp: '2026-11-13T12:10:00Z',
        status: 409,
        code: 'HOLD_EXPIRED',
        message: 'The reservation hold has expired.',
        fieldErrors: []
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: { get: () => 'application/json' },
        json: async () => errorPayload,
      });

      await expect(apiClient('/api/bookings/HB-123456/confirm', { method: 'POST' })).rejects.toThrow(
        'The reservation hold has expired.'
      );
    });

    it('wraps fetch network errors in ApiError with code NETWORK_ERROR', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      await expect(apiClient('/api/hotels')).rejects.toThrow(ApiError);
      try {
        await apiClient('/api/hotels');
      } catch (err) {
        expect(err.status).toBe(0);
        expect(err.code).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('hotels API', () => {
    it('getHotels in browse mode (no dates) dispatches to /api/hotels', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => [],
      });

      await getHotels();
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/hotels', expect.anything());
    });

    it('getHotels with location dispatches exact location query', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => [],
      });

      await getHotels({ location: 'Mumbai' });
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/hotels?location=Mumbai', expect.anything());
    });

    it('getHotels with both dates dispatches availability search query', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => [],
      });

      await getHotels({ checkIn: '2026-12-01', checkOut: '2026-12-05' });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/hotels?checkIn=2026-12-01&checkOut=2026-12-05',
        expect.anything()
      );
    });

    it('getHotels rejects early when only checkIn is supplied', async () => {
      await expect(getHotels({ checkIn: '2026-12-01' })).rejects.toThrow(
        'Both check-in and check-out dates must be provided together.'
      );
    });

    it('getHotelDetail calls /api/hotels/{id} with dates', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ id: 1, name: 'Taj Palace', availableRooms: 2 }),
      });

      await getHotelDetail(1, { checkIn: '2026-12-01', checkOut: '2026-12-03' });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/hotels/1?checkIn=2026-12-01&checkOut=2026-12-03',
        expect.anything()
      );
    });
  });

  describe('bookings API', () => {
    it('reserveBooking rejects early when required fields are missing', async () => {
      await expect(reserveBooking({ hotelId: 1 })).rejects.toThrow('Missing required booking fields.');
    });

    it('reserveBooking dispatches POST /api/bookings with valid payload', async () => {
      const mockBooking = {
        reference: 'HB-987654',
        status: 'HELD',
        expiresAt: '2026-12-01T12:10:00Z',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: { get: () => 'application/json' },
        json: async () => mockBooking,
      });

      const res = await reserveBooking({
        hotelId: 2,
        checkIn: '2026-12-10',
        checkOut: '2026-12-14',
        guestName: 'Aarav Sharma',
        guestEmail: 'aarav@example.com',
      });

      expect(res).toEqual(mockBooking);
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/bookings', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotelId: 2,
          checkIn: '2026-12-10',
          checkOut: '2026-12-14',
          guestName: 'Aarav Sharma',
          guestEmail: 'aarav@example.com',
        }),
      });
    });

    it('confirmBooking dispatches POST /api/bookings/{reference}/confirm with email body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ reference: 'HB-987654', status: 'CONFIRMED' }),
      });

      const res = await confirmBooking('HB-987654', { email: 'aarav@example.com' });
      expect(res.status).toBe('CONFIRMED');
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/bookings/HB-987654/confirm', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'aarav@example.com' }),
      });
    });

    it('getBooking dispatches GET /api/bookings/{reference}?email=...', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ reference: 'HB-987654', status: 'CONFIRMED' }),
      });

      await getBooking('HB-987654', 'aarav@example.com');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/bookings/HB-987654?email=aarav%40example.com',
        expect.anything()
      );
    });

    it('cancelBooking dispatches POST /api/bookings/{reference}/cancel with email body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ reference: 'HB-987654', status: 'CANCELLED' }),
      });

      const res = await cancelBooking('HB-987654', { email: 'aarav@example.com' });
      expect(res.status).toBe('CANCELLED');
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/bookings/HB-987654/cancel', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'aarav@example.com' }),
      });
    });
  });
});
