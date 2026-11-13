import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HotelDetailPage } from '../src/pages/HotelDetailPage.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';
import * as hotelsApi from '../src/api/hotels.js';

const mockHotelDetail = {
  id: 1,
  name: 'The Taj Mahal Palace',
  location: 'Mumbai',
  address: 'Apollo Bandar, Colaba, Mumbai, Maharashtra 400001',
  description: 'Iconic flagship luxury heritage hotel facing the Arabian Sea.',
  imageUrl: null,
  amenities: ['WiFi', 'Pool', 'Luxury Spa', 'Fine Dining', 'Butler Service'],
  pricePerNight: 18500,
  availableRooms: 3,
  nights: 2,
  totalAmount: 37000,
};

const mockSoldOutHotel = {
  ...mockHotelDetail,
  availableRooms: 0,
  nights: 2,
  totalAmount: 37000,
};

const mockBrowseHotel = {
  id: 1,
  name: 'The Taj Mahal Palace',
  location: 'Mumbai',
  address: 'Apollo Bandar, Colaba, Mumbai, Maharashtra 400001',
  description: 'Iconic flagship luxury heritage hotel facing the Arabian Sea.',
  imageUrl: null,
  amenities: ['WiFi', 'Pool', 'Luxury Spa'],
  pricePerNight: 18500,
};

describe('Milestone 3 — Hotel Details Experience Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading skeleton while fetching details', () => {
    vi.spyOn(hotelsApi, 'getHotelDetail').mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <ToastProvider>
        <HotelDetailPage hotelId={1} onBack={() => {}} onProceedToBooking={() => {}} />
      </ToastProvider>
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders hotel name, location, address, amenities, and price when loaded', async () => {
    vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(mockHotelDetail);

    render(
      <ToastProvider>
        <HotelDetailPage
          hotelId={1}
          initialDates={{ checkIn: '2026-12-01', checkOut: '2026-12-03' }}
          onBack={() => {}}
          onProceedToBooking={() => {}}
        />
      </ToastProvider>
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'The Taj Mahal Palace' })).toBeInTheDocument();
    expect(screen.getByText('Mumbai')).toBeInTheDocument();
    expect(screen.getByText(/Apollo Bandar, Colaba/i)).toBeInTheDocument();
    expect(screen.getByText(/Iconic flagship luxury heritage hotel/i)).toBeInTheDocument();
    expect(screen.getByText('Luxury Spa')).toBeInTheDocument();
    expect(screen.getByText('Butler Service')).toBeInTheDocument();
    expect(screen.getAllByText(/₹18,500/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders non-photographic fallback placeholder when imageUrl is null', async () => {
    vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(mockHotelDetail);

    render(
      <ToastProvider>
        <HotelDetailPage hotelId={1} onBack={() => {}} onProceedToBooking={() => {}} />
      </ToastProvider>
    );

    await screen.findByRole('heading', { level: 1, name: 'The Taj Mahal Palace' });
    expect(screen.getByText('Photos coming soon')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View full photo/i })).not.toBeInTheDocument();
  });

  it('renders real photo and opens lightbox modal when imageUrl exists', async () => {
    const photoHotel = {
      ...mockHotelDetail,
      imageUrl: 'https://images.example.com/taj-palace.jpg',
    };
    vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(photoHotel);

    render(
      <ToastProvider>
        <HotelDetailPage hotelId={1} onBack={() => {}} onProceedToBooking={() => {}} />
      </ToastProvider>
    );

    await screen.findByRole('heading', { level: 1, name: 'The Taj Mahal Palace' });

    const photoBtn = screen.getByRole('button', { name: /View full photo/i });
    expect(photoBtn).toBeInTheDocument();

    fireEvent.click(photoBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Full view of The Taj Mahal Palace/i })).toBeInTheDocument();
  });

  it('disables CTA with prompt when no dates are selected (browse mode)', async () => {
    vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(mockBrowseHotel);

    render(
      <ToastProvider>
        <HotelDetailPage hotelId={1} onBack={() => {}} onProceedToBooking={() => {}} />
      </ToastProvider>
    );

    await screen.findByRole('heading', { level: 1, name: 'The Taj Mahal Palace' });
    const bookBtn = screen.getByRole('button', { name: /Select Check-in and Check-out to Book/i });
    expect(bookBtn).toBeDisabled();
    expect(screen.queryByText(/Total Amount/i)).not.toBeInTheDocument();
  });

  it('enables Reserve CTA with availability and total when dates are supplied', async () => {
    vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(mockHotelDetail);
    const handleProceed = vi.fn();

    render(
      <ToastProvider>
        <HotelDetailPage
          hotelId={1}
          initialDates={{ checkIn: '2026-12-01', checkOut: '2026-12-03' }}
          onBack={() => {}}
          onProceedToBooking={handleProceed}
        />
      </ToastProvider>
    );

    await screen.findByRole('heading', { level: 1, name: 'The Taj Mahal Palace' });
    expect(screen.getByText(/3 rooms available/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Amount/i)).toBeInTheDocument();
    expect(screen.getByText(/₹37,000/i)).toBeInTheDocument();

    const reserveBtn = screen.getByRole('button', { name: /Reserve Room • Start 10-Min Hold/i });
    expect(reserveBtn).toBeEnabled();

    fireEvent.click(reserveBtn);
    expect(handleProceed).toHaveBeenCalledWith(
      mockHotelDetail,
      expect.objectContaining({
        checkIn: '2026-12-01',
        checkOut: '2026-12-03',
        totalAmount: 37000,
        nights: 2,
      })
    );
  });

  it('shows Sold Out badge and disables CTA when availableRooms is 0 (M3 Gate)', async () => {
    vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(mockSoldOutHotel);

    render(
      <ToastProvider>
        <HotelDetailPage
          hotelId={1}
          initialDates={{ checkIn: '2026-12-01', checkOut: '2026-12-03' }}
          onBack={() => {}}
          onProceedToBooking={() => {}}
        />
      </ToastProvider>
    );

    await screen.findByRole('heading', { level: 1, name: 'The Taj Mahal Palace' });
    expect(screen.getByText('Sold Out')).toBeInTheDocument();

    const soldOutBtn = screen.getByRole('button', { name: /Sold out for selected dates/i });
    expect(soldOutBtn).toBeDisabled();
  });

  it('renders error state and back button when API call fails', async () => {
    vi.spyOn(hotelsApi, 'getHotelDetail').mockRejectedValue(new Error('Hotel not found with ID: 999'));

    render(
      <ToastProvider>
        <HotelDetailPage hotelId={999} onBack={() => {}} onProceedToBooking={() => {}} />
      </ToastProvider>
    );

    expect(await screen.findByText('Hotel Unavailable')).toBeInTheDocument();
    expect(screen.getAllByText(/Hotel not found with ID: 999/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Return to Hotels Catalog/i })).toBeInTheDocument();
  });

  it('clicking back button triggers onBack handler', async () => {
    vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(mockHotelDetail);
    const handleBack = vi.fn();

    render(
      <ToastProvider>
        <HotelDetailPage hotelId={1} onBack={handleBack} onProceedToBooking={() => {}} />
      </ToastProvider>
    );

    await screen.findByRole('heading', { level: 1, name: 'The Taj Mahal Palace' });
    const backBtn = screen.getByRole('button', { name: /Back to hotel search results/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
