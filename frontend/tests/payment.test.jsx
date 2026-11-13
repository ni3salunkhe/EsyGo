import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DemoPaymentModal } from '../src/components/booking/DemoPaymentModal.jsx';
import { BookingConfirmation } from '../src/components/booking/BookingConfirmation.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';
import * as bookingsApi from '../src/api/bookings.js';
import { ApiError } from '../src/api/client.js';

const mockHeldBooking = {
  reference: 'HB-456789',
  status: 'HELD',
  hotelId: 1,
  hotelName: 'The Taj Mahal Palace',
  roomNumber: '204',
  guestName: 'Rohan Mehta',
  guestEmail: 'rohan@example.com',
  checkIn: '2026-12-15',
  checkOut: '2026-12-18',
  nights: 3,
  pricePerNight: 18500,
  totalAmount: 55500,
  expiresAt: new Date(Date.now() + 600000).toISOString(),
};

const mockConfirmedBooking = {
  ...mockHeldBooking,
  status: 'CONFIRMED',
  expiresAt: null, // expiresAt is omitted by backend upon confirmation
  createdAt: '2026-12-01T10:00:00Z',
};

describe('Milestone 5 — Demo Payment Simulation & Confirmation Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('DemoPaymentModal', () => {
    it('displays mandatory demo simulation notice', () => {
      render(
        <ToastProvider>
          <DemoPaymentModal
            booking={mockHeldBooking}
            onPaymentSuccess={() => {}}
            onBackToHold={() => {}}
          />
        </ToastProvider>
      );

      expect(screen.getByText(/Demo Simulation Notice — No Real Payment Gateway/i)).toBeInTheDocument();
      expect(screen.getByText(/No real payment gateway is integrated/i)).toBeInTheDocument();
    });

    it('displays booking reference, guest email, and total amount to confirm', () => {
      render(
        <ToastProvider>
          <DemoPaymentModal
            booking={mockHeldBooking}
            onPaymentSuccess={() => {}}
            onBackToHold={() => {}}
          />
        </ToastProvider>
      );

      expect(screen.getByText('HB-456789')).toBeInTheDocument();
      expect(screen.getByText('rohan@example.com')).toBeInTheDocument();
      expect(screen.getByText(/₹55,500/i)).toBeInTheDocument();
    });

    it('simulated failure does NOT call confirmBooking API (Gate: Failure does not confirm)', () => {
      const confirmSpy = vi.spyOn(bookingsApi, 'confirmBooking');

      render(
        <ToastProvider>
          <DemoPaymentModal
            booking={mockHeldBooking}
            onPaymentSuccess={() => {}}
            onBackToHold={() => {}}
          />
        </ToastProvider>
      );

      const failBtn = screen.getByRole('button', { name: /Simulate Failed Payment/i });
      fireEvent.click(failBtn);

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent(/Simulated payment declined by user/i);
    });

    it('simulated success calls confirmBooking exactly once with email (Gate: Success calls confirm)', async () => {
      const confirmSpy = vi.spyOn(bookingsApi, 'confirmBooking').mockResolvedValue(mockConfirmedBooking);
      const handleSuccess = vi.fn();

      render(
        <ToastProvider>
          <DemoPaymentModal
            booking={mockHeldBooking}
            onPaymentSuccess={handleSuccess}
            onBackToHold={() => {}}
          />
        </ToastProvider>
      );

      const successBtn = screen.getByRole('button', { name: /Simulate Successful Payment/i });
      fireEvent.click(successBtn);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledTimes(1);
        expect(confirmSpy).toHaveBeenCalledWith('HB-456789', { email: 'rohan@example.com' });
        expect(handleSuccess).toHaveBeenCalledWith(mockConfirmedBooking);
      });
    });

    it('handles HOLD_EXPIRED (409) error from backend and blocks confirmation', async () => {
      vi.spyOn(bookingsApi, 'confirmBooking').mockRejectedValue(
        new ApiError(409, 'HOLD_EXPIRED', 'The reservation hold has expired.', [])
      );

      render(
        <ToastProvider>
          <DemoPaymentModal
            booking={mockHeldBooking}
            onPaymentSuccess={() => {}}
            onBackToHold={() => {}}
          />
        </ToastProvider>
      );

      const successBtn = screen.getByRole('button', { name: /Simulate Successful Payment/i });
      fireEvent.click(successBtn);

      expect(await screen.findByRole('alert')).toHaveTextContent('The reservation hold has expired.');
      expect(successBtn).toBeDisabled();
    });

    it('disables simulation buttons when hold has expired', () => {
      const expiredBooking = {
        ...mockHeldBooking,
        expiresAt: new Date(Date.now() - 5000).toISOString(),
      };

      render(
        <ToastProvider>
          <DemoPaymentModal
            booking={expiredBooking}
            onPaymentSuccess={() => {}}
            onBackToHold={() => {}}
          />
        </ToastProvider>
      );

      expect(screen.getByRole('button', { name: /Simulate Successful Payment/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Simulate Failed Payment/i })).toBeDisabled();
    });
  });

  describe('BookingConfirmation', () => {
    it('displays reference, status CONFIRMED, roomNumber, guest details, and created timestamp', () => {
      render(
        <BookingConfirmation
          booking={mockConfirmedBooking}
          onNavigateToManage={() => {}}
          onNavigateToExplore={() => {}}
        />
      );

      expect(screen.getByRole('heading', { level: 1, name: 'Booking Confirmed!' })).toBeInTheDocument();
      expect(screen.getByText('HB-456789')).toBeInTheDocument();
      expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
      expect(screen.getByText('204')).toBeInTheDocument();
      expect(screen.getByText('Rohan Mehta')).toBeInTheDocument();
      expect(screen.getByText(/₹55,500/i)).toBeInTheDocument();
      expect(screen.getByText('Demo Simulation')).toBeInTheDocument();
      expect(screen.getByText(/No real charge processed/i)).toBeInTheDocument();
    });

    it('copies booking reference to clipboard', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(
        <BookingConfirmation
          booking={mockConfirmedBooking}
          onNavigateToManage={() => {}}
          onNavigateToExplore={() => {}}
        />
      );

      const copyBtn = screen.getByRole('button', { name: /Copy booking reference/i });
      fireEvent.click(copyBtn);

      expect(writeTextMock).toHaveBeenCalledWith('HB-456789');
    });

    it('triggers window.print when print button is clicked', () => {
      const printMock = vi.fn();
      window.print = printMock;

      render(
        <BookingConfirmation
          booking={mockConfirmedBooking}
          onNavigateToManage={() => {}}
          onNavigateToExplore={() => {}}
        />
      );

      const printBtn = screen.getByRole('button', { name: /Print \/ Save Receipt/i });
      fireEvent.click(printBtn);

      expect(printMock).toHaveBeenCalledTimes(1);
    });
  });
});
