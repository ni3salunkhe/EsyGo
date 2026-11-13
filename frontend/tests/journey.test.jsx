import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App.jsx';
import * as hotelsApi from '../src/api/hotels.js';
import * as bookingsApi from '../src/api/bookings.js';

const mockHotels = [
  {
    id: 1,
    name: 'The Taj Mahal Palace',
    location: 'Mumbai',
    address: 'Apollo Bandar, Colaba, Mumbai, Maharashtra 400001',
    description: 'Iconic flagship luxury heritage hotel facing the Arabian Sea.',
    imageUrl: null,
    amenities: ['WiFi', 'Pool', 'Spa', 'Fine Dining'],
    pricePerNight: 18500,
  },
];

const mockHotelDetail = {
  ...mockHotels[0],
  availableRooms: 3,
  nights: 2,
  totalAmount: 37000,
};

const mockHeldBooking = {
  reference: 'HB-999888',
  status: 'HELD',
  hotelId: 1,
  hotelName: 'The Taj Mahal Palace',
  roomNumber: '105',
  guestName: 'Meera Sen',
  guestEmail: 'meera@example.com',
  checkIn: '2026-12-10',
  checkOut: '2026-12-12',
  nights: 2,
  pricePerNight: 18500,
  totalAmount: 37000,
  expiresAt: new Date(Date.now() + 600000).toISOString(),
  createdAt: '2026-11-13T10:00:00Z',
};

const mockConfirmedBooking = {
  ...mockHeldBooking,
  status: 'CONFIRMED',
  expiresAt: null,
};

const mockCancelledBooking = {
  ...mockConfirmedBooking,
  status: 'CANCELLED',
};

describe('Milestone 7 — Complete End-to-End User Journey Regression Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executes full end-to-end guest journey: Discovery -> Detail -> Hold -> Demo Payment -> Confirmation -> Manage -> Cancellation', async () => {
    vi.spyOn(hotelsApi, 'getHotels').mockResolvedValue(mockHotels);
    vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(mockHotelDetail);
    const reserveSpy = vi.spyOn(bookingsApi, 'reserveBooking').mockResolvedValue(mockHeldBooking);
    const confirmSpy = vi.spyOn(bookingsApi, 'confirmBooking').mockResolvedValue(mockConfirmedBooking);
    const getBookingSpy = vi.spyOn(bookingsApi, 'getBooking').mockResolvedValue(mockConfirmedBooking);
    const cancelSpy = vi.spyOn(bookingsApi, 'cancelBooking').mockResolvedValue(mockCancelledBooking);

    render(<App />);

    // 1. Landing Page: Browse hotels loaded from API
    expect(await screen.findByRole('heading', { level: 3, name: 'The Taj Mahal Palace' })).toBeInTheDocument();

    // 2. Select dates in SearchCapsule
    const checkInInput = screen.getByLabelText(/Check-In/i);
    const checkOutInput = screen.getByLabelText(/Check-Out/i);
    fireEvent.change(checkInInput, { target: { value: '2026-12-10' } });
    fireEvent.change(checkOutInput, { target: { value: '2026-12-12' } });
    fireEvent.click(screen.getByRole('button', { name: /Search Hotels/i }));

    // 3. Click Hotel Card to view details
    const hotelCard = await screen.findByRole('button', { name: /View details for The Taj Mahal Palace/i });
    fireEvent.click(hotelCard);

    // 4. On HotelDetailPage: Verify specifications and room availability
    expect(await screen.findByRole('heading', { level: 1, name: 'The Taj Mahal Palace' })).toBeInTheDocument();
    expect(screen.getByText(/3 rooms available/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Amount/i)).toBeInTheDocument();

    // 5. Click "Reserve Room • Start 10-Min Hold"
    const reserveCTA = screen.getByRole('button', { name: /Reserve Room • Start 10-Min Hold/i });
    fireEvent.click(reserveCTA);

    // 6. On GuestForm: Fill name and email, submit
    expect(await screen.findByRole('heading', { level: 2, name: 'Guest Details' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Meera Sen' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'meera@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Secure 10-Minute Hold/i }));

    // 7. Verify HoldReviewModal: displays reference, status HELD, roomNumber, and countdown timer
    await waitFor(() => {
      expect(reserveSpy).toHaveBeenCalledWith({
        hotelId: 1,
        checkIn: '2026-12-10',
        checkOut: '2026-12-12',
        guestName: 'Meera Sen',
        guestEmail: 'meera@example.com',
      });
      expect(screen.getByText('HB-999888')).toBeInTheDocument();
      expect(screen.getByText('HELD')).toBeInTheDocument();
      expect(screen.getByText('105')).toBeInTheDocument();
    });

    // 8. Click "Proceed to Demo Payment"
    const paymentCTA = screen.getByRole('button', { name: /Proceed to Demo Payment/i });
    fireEvent.click(paymentCTA);

    // 9. On DemoPaymentModal: Verify simulation notice and click "Simulate Successful Payment"
    expect(await screen.findByRole('heading', { level: 2, name: 'Demo Payment Simulation' })).toBeInTheDocument();
    expect(screen.getByText(/Demo Simulation Notice — No Real Payment Gateway/i)).toBeInTheDocument();

    const simulateSuccessBtn = screen.getByRole('button', { name: /Simulate Successful Payment/i });
    fireEvent.click(simulateSuccessBtn);

    // 10. Verify BookingConfirmation ticket: displays CONFIRMED status
    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith('HB-999888', { email: 'meera@example.com' });
      expect(screen.getByRole('heading', { level: 1, name: 'Booking Confirmed!' })).toBeInTheDocument();
      expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
      expect(screen.getByText('Demo Simulation')).toBeInTheDocument();
    });

    // 11. Navigate to Manage This Booking
    const manageCTA = screen.getByRole('button', { name: /Manage This Booking/i });
    fireEvent.click(manageCTA);

    // 12. On ManageBookingPage: Auto-prefilled lookup retrieves booking details
    await waitFor(() => {
      expect(getBookingSpy).toHaveBeenCalledWith('HB-999888', 'meera@example.com');
      expect(screen.getByRole('heading', { level: 1, name: 'Manage Your Booking' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel Booking/i })).toBeInTheDocument();
    });

    // 13. Open Cancellation Confirmation Dialog
    const cancelCTA = screen.getByRole('button', { name: /Cancel Booking/i });
    fireEvent.click(cancelCTA);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Confirm Booking Cancellation/i)).toBeInTheDocument();

    // 14. Confirm Cancellation
    const confirmCancelBtn = screen.getByRole('button', { name: /Yes, Cancel Booking/i });
    fireEvent.click(confirmCancelBtn);

    // 15. Verify status updates to CANCELLED and room nights are released
    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith('HB-999888', { email: 'meera@example.com' });
      expect(screen.getByText('CANCELLED')).toBeInTheDocument();
      expect(screen.getByText(/This reservation has been cancelled/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Cancel Booking$/i })).not.toBeInTheDocument();
    });
  });
});
