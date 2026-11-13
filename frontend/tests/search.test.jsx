import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchCapsule } from '../src/components/search/SearchCapsule.jsx';
import { FilterDrawer } from '../src/components/search/FilterDrawer.jsx';
import { HotelCard } from '../src/components/hotel/HotelCard.jsx';
import { HotelList } from '../src/components/hotel/HotelList.jsx';
import { LandingPage } from '../src/pages/LandingPage.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';
import * as hotelsApi from '../src/api/hotels.js';

const mockHotels = [
  {
    id: 1,
    name: 'The Taj Mahal Palace',
    location: 'Mumbai',
    address: 'Apollo Bandar, Colaba, Mumbai, Maharashtra 400001',
    description: 'Iconic heritage hotel overlooking the Gateway of India.',
    imageUrl: null,
    amenities: ['WiFi', 'Pool', 'Spa', 'Fine Dining'],
    pricePerNight: 18500,
  },
  {
    id: 2,
    name: 'The Oberoi Grand',
    location: 'Kolkata',
    address: '15 Jawaharlal Nehru Rd, Kolkata, West Bengal 700013',
    description: 'Colonial-era luxury property in central Kolkata.',
    imageUrl: null,
    amenities: ['WiFi', 'Spa', 'Gym', 'Bar'],
    pricePerNight: 12000,
  },
  {
    id: 3,
    name: 'ITC Grand Chola',
    location: 'Chennai',
    address: '63 Mount Road, Guindy, Chennai, Tamil Nadu 600032',
    description: 'Palatial luxury hotel inspired by Chola dynasty architecture.',
    imageUrl: null,
    amenities: ['WiFi', 'Pool', 'Gym', 'Valet Parking'],
    pricePerNight: 9500,
  },
];

describe('Milestone 2 — Discovery & Search Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('SearchCapsule', () => {
    it('renders input fields for destination and check-in/out dates', () => {
      render(<SearchCapsule onSearch={() => {}} onReset={() => {}} />);
      expect(screen.getByPlaceholderText(/City \(e\.g\. Mumbai\) or hotel name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Check-In/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Check-Out/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Search Hotels/i })).toBeInTheDocument();
    });

    it('displays validation alert when user submits with only one date', async () => {
      const handleSearch = vi.fn();
      render(<SearchCapsule onSearch={handleSearch} onReset={() => {}} />);

      const checkInInput = screen.getByLabelText(/Check-In/i);
      fireEvent.change(checkInInput, { target: { value: '2026-12-01' } });

      const submitBtn = screen.getByRole('button', { name: /Search Hotels/i });
      fireEvent.click(submitBtn);

      expect(await screen.findByRole('alert')).toHaveTextContent(/Please select a check-out date/i);
      expect(handleSearch).not.toHaveBeenCalled();
    });

    it('submits search criteria when both dates are provided', async () => {
      const handleSearch = vi.fn();
      render(<SearchCapsule onSearch={handleSearch} onReset={() => {}} />);

      const destInput = screen.getByPlaceholderText(/City \(e\.g\. Mumbai\) or hotel name/i);
      const checkInInput = screen.getByLabelText(/Check-In/i);
      const checkOutInput = screen.getByLabelText(/Check-Out/i);

      fireEvent.change(destInput, { target: { value: 'Mumbai' } });
      fireEvent.change(checkInInput, { target: { value: '2026-12-10' } });
      fireEvent.change(checkOutInput, { target: { value: '2026-12-14' } });

      const submitBtn = screen.getByRole('button', { name: /Search Hotels/i });
      fireEvent.click(submitBtn);

      expect(handleSearch).toHaveBeenCalledWith({
        query: 'Mumbai',
        checkIn: '2026-12-10',
        checkOut: '2026-12-14',
      });
    });

    it('submits text query in browse mode (no dates)', () => {
      const handleSearch = vi.fn();
      render(<SearchCapsule onSearch={handleSearch} onReset={() => {}} />);

      const destInput = screen.getByPlaceholderText(/City \(e\.g\. Mumbai\) or hotel name/i);
      fireEvent.change(destInput, { target: { value: 'Taj' } });

      const submitBtn = screen.getByRole('button', { name: /Search Hotels/i });
      fireEvent.click(submitBtn);

      expect(handleSearch).toHaveBeenCalledWith({
        query: 'Taj',
        checkIn: '',
        checkOut: '',
      });
    });
  });

  describe('FilterDrawer', () => {
    it('renders list of dynamic amenities extracted from API catalog', () => {
      render(
        <FilterDrawer
          availableAmenities={['Pool', 'Spa', 'WiFi']}
          selectedAmenities={[]}
          onToggleAmenity={() => {}}
          onSortChange={() => {}}
          onPriceChange={() => {}}
          onResetFilters={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: 'Pool' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Spa' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'WiFi' })).toBeInTheDocument();
    });

    it('toggles amenity filter on button click', () => {
      const handleToggle = vi.fn();
      render(
        <FilterDrawer
          availableAmenities={['Pool', 'Spa']}
          selectedAmenities={['Pool']}
          onToggleAmenity={handleToggle}
          onSortChange={() => {}}
          onPriceChange={() => {}}
          onResetFilters={() => {}}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Spa' }));
      expect(handleToggle).toHaveBeenCalledWith('Spa');
    });

    it('triggers sort change on select', () => {
      const handleSort = vi.fn();
      render(
        <FilterDrawer
          availableAmenities={[]}
          selectedAmenities={[]}
          onToggleAmenity={() => {}}
          onSortChange={handleSort}
          onPriceChange={() => {}}
          onResetFilters={() => {}}
        />
      );

      const sortSelect = screen.getByLabelText(/Sort By/i);
      fireEvent.change(sortSelect, { target: { value: 'price-asc' } });
      expect(handleSort).toHaveBeenCalledWith('price-asc');
    });
  });

  describe('HotelCard', () => {
    it('renders real hotel attributes and non-photographic fallback', () => {
      const handleSelect = vi.fn();
      render(<HotelCard hotel={mockHotels[0]} hasDates={false} onSelect={handleSelect} />);

      expect(screen.getByRole('heading', { level: 3, name: 'The Taj Mahal Palace' })).toBeInTheDocument();
      expect(screen.getByText('Mumbai')).toBeInTheDocument();
      expect(screen.getByText(/Apollo Bandar/i)).toBeInTheDocument();
      expect(screen.getByText(/₹18,500/i)).toBeInTheDocument();
      expect(screen.getByText('Photos coming soon')).toBeInTheDocument();
      expect(screen.getByText('Pool')).toBeInTheDocument();

      // Browse mode: availability & total omitted
      expect(screen.queryByText(/available/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Total ₹/i)).not.toBeInTheDocument();

      // Click card
      fireEvent.click(screen.getByRole('button', { name: /View details for The Taj Mahal Palace/i }));
      expect(handleSelect).toHaveBeenCalledWith(1);
    });

    it('renders availableRooms and totalAmount in search mode with dates', () => {
      const searchHotel = {
        ...mockHotels[0],
        availableRooms: 3,
        nights: 2,
        totalAmount: 37000,
      };

      render(<HotelCard hotel={searchHotel} hasDates={true} onSelect={() => {}} />);
      expect(screen.getByText(/3 rooms available/i)).toBeInTheDocument();
      expect(screen.getByText(/Total ₹37,000 \(2 nights\)/i)).toBeInTheDocument();
    });
  });

  describe('HotelList', () => {
    it('renders loading skeletons when loading is true', () => {
      const { container } = render(<HotelList loading={true} hotels={[]} />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders empty message when no properties match', () => {
      render(
        <HotelList
          hotels={[]}
          totalApiHotels={5}
          loading={false}
          hasDates={false}
          onResetFilters={() => {}}
          onSelectHotel={() => {}}
        />
      );
      expect(screen.getByText(/No Matching Hotels/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset Filters/i })).toBeInTheDocument();
    });
  });

  describe('LandingPage Integration', () => {
    it('loads and renders hotels from API on mount', async () => {
      vi.spyOn(hotelsApi, 'getHotels').mockResolvedValue(mockHotels);

      render(
        <ToastProvider>
          <LandingPage onSelectHotel={() => {}} />
        </ToastProvider>
      );

      expect(await screen.findByRole('heading', { level: 3, name: 'The Taj Mahal Palace' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'The Oberoi Grand' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'ITC Grand Chola' })).toBeInTheDocument();
    });

    it('filters hotels by destination text match on client', async () => {
      vi.spyOn(hotelsApi, 'getHotels').mockResolvedValue(mockHotels);

      render(
        <ToastProvider>
          <LandingPage onSelectHotel={() => {}} />
        </ToastProvider>
      );

      await screen.findByRole('heading', { level: 3, name: 'The Taj Mahal Palace' });

      // Search for "Kolkata"
      const searchInput = screen.getByPlaceholderText(/City \(e\.g\. Mumbai\) or hotel name/i);
      fireEvent.change(searchInput, { target: { value: 'Kolkata' } });
      fireEvent.click(screen.getByRole('button', { name: /Search Hotels/i }));

      // Wait for loading to finish and only Oberoi Grand to be displayed
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 3, name: 'The Oberoi Grand' })).toBeInTheDocument();
      });
      expect(screen.queryByRole('heading', { level: 3, name: 'The Taj Mahal Palace' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 3, name: 'ITC Grand Chola' })).not.toBeInTheDocument();
    });
  });
});
