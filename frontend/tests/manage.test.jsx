import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManageBookingPage } from '../src/pages/ManageBookingPage.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';
import * as bookingsApi from '../src/api/bookings.js';
import { ApiError } from '../src/api/client.js';

const mockFutureBooking = {
  reference: 'HB-333444',
  status: 'CONFIRMED',
  hotelId: 1,
  hotelName: 'The Taj Mahal Palace',
  roomNumber: '302',
  guestName: 'Vikram Malhotra',
  guestEmail: 'vikram@example.com',
  checkIn: '2026-12-20', // future date
  checkOut: '2026-12-25',
  nights: 5,
  pricePerNight: 18500,
  totalAmount: 92500,
  createdAt: '2026-11-13T10:00:00Z',
};

const mockPastOrCurrentBooking = {
  ...mockFutureBooking,
  reference: 'HB-555666',
  checkIn: '2026-11-10', // past date
  checkOut: '2026-11-15',
};

const mockCancelledBooking = {
  ...mockFutureBooking,
  status: 'CANCELLED',
};

describe('Milestone 6 — Manage Booking & Cancellation Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders lookup form requiring both reference and email', () => {
    render(
      <ToastProvider>
        <ManageBookingPage />
      </ToastProvider>
    );

    expect(screen.getByLabelText(/Booking Reference/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Registered Guest Email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retrieve Booking/i })).toBeInTheDocument();
  });

  it('validates missing reference or email client-side without calling API (UI-18)', () => {
    const getBookingSpy = vi.spyOn(bookingsApi, 'getBooking');

    render(
      <ToastProvider>
        <ManageBookingPage />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Retrieve Booking/i }));

    expect(screen.getByText('Booking reference is required.')).toBeInTheDocument();
    expect(screen.getByText('Registered email address is required.')).toBeInTheDocument();
    expect(getBookingSpy).not.toHaveBeenCalled();
  });

  it('displays uniform 404 message when booking is not found (UI-19)', async () => {
    vi.spyOn(bookingsApi, 'getBooking').mockRejectedValue(
      new ApiError(404, 'NOT_FOUND', 'Booking not found with reference: HB-000000', [])
    );

    render(
      <ToastProvider>
        <ManageBookingPage />
      </ToastProvider>
    );

    fireEvent.change(screen.getByLabelText(/Booking Reference/i), { target: { value: 'HB-000000' } });
    fireEvent.change(screen.getByLabelText(/Registered Guest Email/i), { target: { value: 'nobody@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Retrieve Booking/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Booking not found. Please verify that both the booking reference and registered email match/i
    );
  });

  it('retrieves and renders booking details accurately', async () => {
    vi.spyOn(bookingsApi, 'getBooking').mockResolvedValue(mockFutureBooking);

    render(
      <ToastProvider>
        <ManageBookingPage />
      </ToastProvider>
    );

    fireEvent.change(screen.getByLabelText(/Booking Reference/i), { target: { value: 'HB-333444' } });
    fireEvent.change(screen.getByLabelText(/Registered Guest Email/i), { target: { value: 'vikram@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Retrieve Booking/i }));

    expect(await screen.findByText('HB-333444')).toBeInTheDocument();
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
    expect(screen.getByText('302')).toBeInTheDocument();
    expect(screen.getByText('Vikram Malhotra')).toBeInTheDocument();
    expect(screen.getByText(/₹92,500/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel Booking/i })).toBeInTheDocument();
  });

  it('dismissing the cancellation dialog does NOT call cancelBooking API (UI-20)', async () => {
    vi.spyOn(bookingsApi, 'getBooking').mockResolvedValue(mockFutureBooking);
    const cancelSpy = vi.spyOn(bookingsApi, 'cancelBooking');

    render(
      <ToastProvider>
        <ManageBookingPage />
      </ToastProvider>
    );

    fireEvent.change(screen.getByLabelText(/Booking Reference/i), { target: { value: 'HB-333444' } });
    fireEvent.change(screen.getByLabelText(/Registered Guest Email/i), { target: { value: 'vikram@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Retrieve Booking/i }));

    const cancelBtn = await screen.findByRole('button', { name: /Cancel Booking/i });
    fireEvent.click(cancelBtn);

    // Dialog opens
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click "Keep My Booking"
    const keepBtn = screen.getByRole('button', { name: /Keep My Booking/i });
    fireEvent.click(keepBtn);

    expect(cancelSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('confirming cancellation calls API once and updates status to CANCELLED (UI-21)', async () => {
    vi.spyOn(bookingsApi, 'getBooking').mockResolvedValue(mockFutureBooking);
    const cancelSpy = vi.spyOn(bookingsApi, 'cancelBooking').mockResolvedValue(mockCancelledBooking);

    render(
      <ToastProvider>
        <ManageBookingPage />
      </ToastProvider>
    );

    fireEvent.change(screen.getByLabelText(/Booking Reference/i), { target: { value: 'HB-333444' } });
    fireEvent.change(screen.getByLabelText(/Registered Guest Email/i), { target: { value: 'vikram@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Retrieve Booking/i }));

    const cancelBtn = await screen.findByRole('button', { name: /Cancel Booking/i });
    fireEvent.click(cancelBtn);

    // Confirm cancel in dialog
    const confirmCancelBtn = screen.getByRole('button', { name: /Yes, Cancel Booking/i });
    fireEvent.click(confirmCancelBtn);

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledTimes(1);
      expect(cancelSpy).toHaveBeenCalledWith('HB-333444', { email: 'vikram@example.com' });
      expect(screen.getByText('CANCELLED')).toBeInTheDocument();
      expect(screen.getByText(/This reservation has been cancelled/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Cancel Booking$/i })).not.toBeInTheDocument();
    });
  });

  it('disallows cancellation for past or same-day check-in dates (UI-22)', async () => {
    vi.spyOn(bookingsApi, 'getBooking').mockResolvedValue(mockPastOrCurrentBooking);

    render(
      <ToastProvider>
        <ManageBookingPage />
      </ToastProvider>
    );

    fireEvent.change(screen.getByLabelText(/Booking Reference/i), { target: { value: 'HB-555666' } });
    fireEvent.change(screen.getByLabelText(/Registered Guest Email/i), { target: { value: 'vikram@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Retrieve Booking/i }));

    await screen.findByText('HB-555666');
    expect(screen.getByText(/Cancellation Period Lapsed/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Cancel Booking$/i })).not.toBeInTheDocument();
  });
});
