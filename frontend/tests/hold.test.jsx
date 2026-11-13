import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CountdownTimer } from '../src/components/booking/CountdownTimer.jsx';
import { GuestForm } from '../src/components/booking/GuestForm.jsx';
import { HoldReviewModal } from '../src/components/booking/HoldReviewModal.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';
import * as bookingsApi from '../src/api/bookings.js';
import { ApiError } from '../src/api/client.js';

const mockHotel = {
  id: 1,
  name: 'The Taj Mahal Palace',
  location: 'Mumbai',
  pricePerNight: 18500,
};

const mockHeldBooking = {
  reference: 'HB-789012',
  status: 'HELD',
  hotelId: 1,
  hotelName: 'The Taj Mahal Palace',
  roomNumber: '101',
  guestName: 'Ananya Roy',
  guestEmail: 'ananya@example.com',
  checkIn: '2026-12-10',
  checkOut: '2026-12-14',
  nights: 4,
  pricePerNight: 18500,
  totalAmount: 74000,
  expiresAt: new Date(Date.now() + 600000).toISOString(), // 10 mins from now
  createdAt: new Date().toISOString(),
};

describe('Milestone 4 — Guest Details & Reservation Hold Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('CountdownTimer', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('renders initial countdown remaining time (e.g. 10:00)', () => {
      const futureExpiry = new Date(Date.now() + 600000).toISOString();
      render(<CountdownTimer expiresAt={futureExpiry} onExpire={() => {}} />);
      expect(screen.getByRole('timer')).toBeInTheDocument();
      expect(screen.getByText(/10:00/i)).toBeInTheDocument();
    });

    it('decrements time every second', () => {
      const futureExpiry = new Date(Date.now() + 600000).toISOString();
      render(<CountdownTimer expiresAt={futureExpiry} onExpire={() => {}} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText(/09:58/i)).toBeInTheDocument();
    });

    it('triggers onExpire callback and displays expired warning when time reaches zero', () => {
      const expireCallback = vi.fn();
      const nearExpiry = new Date(Date.now() + 2000).toISOString();
      render(<CountdownTimer expiresAt={nearExpiry} onExpire={expireCallback} />);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText(/Hold Expired • Inventory released back to catalog/i)).toBeInTheDocument();
      expect(expireCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('GuestForm', () => {
    it('renders guest name and email inputs along with stay summary', () => {
      render(
        <ToastProvider>
          <GuestForm
            hotel={mockHotel}
            checkIn="2026-12-10"
            checkOut="2026-12-14"
            nights={4}
            totalAmount={74000}
            onHoldSuccess={() => {}}
            onCancel={() => {}}
          />
        </ToastProvider>
      );

      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByText('The Taj Mahal Palace')).toBeInTheDocument();
      expect(screen.getByText(/₹74,000/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Secure 10-Minute Hold/i })).toBeInTheDocument();
    });

    it('validates empty inputs client-side and prevents API call', () => {
      const reserveSpy = vi.spyOn(bookingsApi, 'reserveBooking');

      render(
        <ToastProvider>
          <GuestForm
            hotel={mockHotel}
            checkIn="2026-12-10"
            checkOut="2026-12-14"
            nights={4}
            totalAmount={74000}
            onHoldSuccess={() => {}}
            onCancel={() => {}}
          />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: /Secure 10-Minute Hold/i }));
      expect(screen.getByText('Guest name is required.')).toBeInTheDocument();
      expect(screen.getByText('Email address is required.')).toBeInTheDocument();
      expect(reserveSpy).not.toHaveBeenCalled();
    });

    it('validates email format before submitting', () => {
      const reserveSpy = vi.spyOn(bookingsApi, 'reserveBooking');

      render(
        <ToastProvider>
          <GuestForm
            hotel={mockHotel}
            checkIn="2026-12-10"
            checkOut="2026-12-14"
            nights={4}
            totalAmount={74000}
            onHoldSuccess={() => {}}
            onCancel={() => {}}
          />
        </ToastProvider>
      );

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Ananya Roy' } });
      fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'invalid-email' } });
      fireEvent.click(screen.getByRole('button', { name: /Secure 10-Minute Hold/i }));

      expect(screen.getByText('Please provide a valid email address.')).toBeInTheDocument();
      expect(reserveSpy).not.toHaveBeenCalled();
    });

    it('submits valid payload (no price authority sent) and calls onHoldSuccess on 201 Created', async () => {
      const reserveSpy = vi.spyOn(bookingsApi, 'reserveBooking').mockResolvedValue(mockHeldBooking);
      const handleHoldSuccess = vi.fn();

      render(
        <ToastProvider>
          <GuestForm
            hotel={mockHotel}
            checkIn="2026-12-10"
            checkOut="2026-12-14"
            nights={4}
            totalAmount={74000}
            onHoldSuccess={handleHoldSuccess}
            onCancel={() => {}}
          />
        </ToastProvider>
      );

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Ananya Roy' } });
      fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'ananya@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /Secure 10-Minute Hold/i }));

      await waitFor(() => {
        expect(reserveSpy).toHaveBeenCalledWith({
          hotelId: 1,
          checkIn: '2026-12-10',
          checkOut: '2026-12-14',
          guestName: 'Ananya Roy',
          guestEmail: 'ananya@example.com',
        });
        expect(handleHoldSuccess).toHaveBeenCalledWith(mockHeldBooking);
      });
    });

    it('displays backend error message on SOLD_OUT or CONCURRENCY_CONFLICT', async () => {
      vi.spyOn(bookingsApi, 'reserveBooking').mockRejectedValue(
        new ApiError(409, 'SOLD_OUT', 'No rooms available for the selected dates.', [])
      );

      render(
        <ToastProvider>
          <GuestForm
            hotel={mockHotel}
            checkIn="2026-12-10"
            checkOut="2026-12-14"
            nights={4}
            totalAmount={74000}
            onHoldSuccess={() => {}}
            onCancel={() => {}}
          />
        </ToastProvider>
      );

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Ananya Roy' } });
      fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'ananya@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /Secure 10-Minute Hold/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent('No rooms available for the selected dates.');
    });
  });

  describe('HoldReviewModal', () => {
    it('displays reference, status HELD, roomNumber, guest details, and total amount', () => {
      render(
        <HoldReviewModal
          booking={mockHeldBooking}
          onProceedToPayment={() => {}}
          onReleaseHold={() => {}}
        />
      );

      expect(screen.getByText('HB-789012')).toBeInTheDocument();
      expect(screen.getByText('HELD')).toBeInTheDocument();
      expect(screen.getByText('101')).toBeInTheDocument();
      expect(screen.getByText('Ananya Roy')).toBeInTheDocument();
      expect(screen.getByText(/₹74,000/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Proceed to Demo Payment/i })).toBeEnabled();
    });

    it('disables proceed button when hold has expired', () => {
      const expiredBooking = {
        ...mockHeldBooking,
        expiresAt: new Date(Date.now() - 5000).toISOString(),
      };

      render(
        <HoldReviewModal
          booking={expiredBooking}
          onProceedToPayment={() => {}}
          onReleaseHold={() => {}}
        />
      );

      expect(screen.getByText(/Your 10-minute hold has expired/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Proceed to Demo Payment/i })).toBeDisabled();
    });
  });
});
