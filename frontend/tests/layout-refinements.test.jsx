import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HotelCard } from '../src/components/hotel/HotelCard.jsx';
import { HotelList } from '../src/components/hotel/HotelList.jsx';
import { HotelCardSkeleton } from '../src/components/common/Skeleton.jsx';
import { LandingPage } from '../src/pages/LandingPage.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';
import * as hotelsApi from '../src/api/hotels.js';

const mockHotel = {
  id: 1,
  name: 'The Taj Mahal Palace',
  location: 'Mumbai',
  address: 'Apollo Bandar, Colaba, Mumbai, Maharashtra 400001',
  description: 'Iconic heritage hotel overlooking the Gateway of India.',
  imageUrl: null,
  amenities: ['WiFi', 'Pool', 'Spa', 'Fine Dining', 'Valet Parking', 'Concierge'],
  pricePerNight: 18500,
  availableRooms: 4,
  nights: 2,
  totalAmount: 37000,
};

describe('Landing Page Layout Refinements & Scroll Smoothness', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Compact Horizontal Hotel Card Layout', () => {
    it('renders with horizontal flex layout classes on desktop and responsive stacking on mobile', () => {
      const { container } = render(
        <HotelCard hotel={mockHotel} hasDates={true} onSelect={() => {}} />
      );

      const article = container.querySelector('article');
      expect(article).toBeInTheDocument();
      // Should have flex-col for mobile and md:flex-row for desktop
      expect(article.className).toContain('flex-col');
      expect(article.className).toContain('md:flex-row');

      // Left section (image / placeholder container) - compact width 220-260px (md:w-60 lg:w-64)
      const leftSection = screen.getByTestId('hotel-card-media');
      expect(leftSection).toBeInTheDocument();
      expect(leftSection.className).toContain('md:w-60');

      // Right section (content & actions)
      const rightSection = screen.getByTestId('hotel-card-content');
      expect(rightSection).toBeInTheDocument();
      expect(rightSection.className).toContain('flex-1');
      expect(rightSection.className).toContain('flex-col');
    });

    it('renders all required right-section fields: name, location, address, description, amenities, availability, pricing, and View Details action', () => {
      const handleSelect = vi.fn();
      render(<HotelCard hotel={mockHotel} hasDates={true} onSelect={handleSelect} />);

      // Hotel Name
      expect(screen.getByRole('heading', { level: 3, name: 'The Taj Mahal Palace' })).toBeInTheDocument();
      // Location
      expect(screen.getByText('Mumbai')).toBeInTheDocument();
      // Address
      expect(screen.getByText(/Apollo Bandar/i)).toBeInTheDocument();
      // Description
      expect(screen.getByText(/Iconic heritage hotel/i)).toBeInTheDocument();
      // Amenities
      expect(screen.getByText('WiFi')).toBeInTheDocument();
      expect(screen.getByText('Pool')).toBeInTheDocument();
      expect(screen.getByText('Spa')).toBeInTheDocument();
      // Availability
      expect(screen.getByText(/4 rooms available/i)).toBeInTheDocument();
      // Pricing
      expect(screen.getByText(/₹18,500/i)).toBeInTheDocument();
      expect(screen.getByText(/Total ₹37,000 \(2 nights\)/i)).toBeInTheDocument();
      // Primary Action: View Details button
      const ctaBtn = screen.getByRole('button', { name: /^View Details$/i });
      expect(ctaBtn).toBeInTheDocument();
      fireEvent.click(ctaBtn);
      expect(handleSelect).toHaveBeenCalledWith(1);
    });

    it('HotelList renders compact full-width vertical list instead of two-column grid', () => {
      render(
        <HotelList
          hotels={[mockHotel]}
          loading={false}
          hasDates={true}
          totalApiHotels={1}
          onResetFilters={() => {}}
          onSelectHotel={() => {}}
        />
      );

      const listContainer = screen.getByTestId('hotel-card-list');
      expect(listContainer).toBeInTheDocument();
      expect(listContainer.className).toContain('flex');
      expect(listContainer.className).toContain('flex-col');
      expect(listContainer.className).not.toContain('grid-cols-2');
      expect(listContainer.className).not.toContain('grid-cols-3');
    });

    it('HotelCardSkeleton mirrors compact horizontal layout on desktop', () => {
      const { container } = render(<HotelCardSkeleton />);
      const skeletonRoot = container.firstChild;
      expect(skeletonRoot.className).toContain('flex-col');
      expect(skeletonRoot.className).toContain('md:flex-row');
    });
  });

  describe('2. Sticky Search Capsule & Stacking Order', () => {
    it('places SearchCapsule in a sticky container immediately below the navbar with proper z-index and solid background', async () => {
      vi.spyOn(hotelsApi, 'getHotels').mockResolvedValue([mockHotel]);

      render(
        <ToastProvider>
          <LandingPage onSelectHotel={() => {}} />
        </ToastProvider>
      );

      await screen.findByRole('heading', { level: 3, name: 'The Taj Mahal Palace' });

      const stickySearchWrapper = screen.getByTestId('sticky-search-wrapper');
      expect(stickySearchWrapper).toBeInTheDocument();
      expect(stickySearchWrapper.className).toContain('sticky');
      // Sticky top offset calculated from navbar height: top-16 on mobile (64px), sm:top-20 on desktop (80px)
      expect(stickySearchWrapper.className).toContain('top-16');
      expect(stickySearchWrapper.className).toContain('sm:top-20');
      // z-30 ensures search capsule stays above hotel results and sidebar, below navbar (z-40) and modals (z-50)
      expect(stickySearchWrapper.className).toContain('z-30');
    });
  });

  describe('3. Native Document Scrolling & Scroll-Trapping Prevention', () => {
    it('desktop filter sidebar does NOT contain nested overflow scroll container that traps mouse wheel', async () => {
      vi.spyOn(hotelsApi, 'getHotels').mockResolvedValue([mockHotel]);

      render(
        <ToastProvider>
          <LandingPage onSelectHotel={() => {}} />
        </ToastProvider>
      );

      await screen.findByRole('heading', { level: 3, name: 'The Taj Mahal Palace' });

      const filterSidebar = screen.getByTestId('filter-sidebar');
      expect(filterSidebar).toBeInTheDocument();
      expect(filterSidebar.className).toContain('sticky');
      // Positioned below search area (top-44 / top-48, z-20)
      expect(filterSidebar.className).toContain('z-20');

      // Crucial: No nested overflow-y-auto or fixed height on the desktop filter card
      const filterInnerCard = filterSidebar.querySelector('div');
      expect(filterInnerCard.className).not.toContain('overflow-y-auto');
      expect(filterInnerCard.className).not.toContain('overflow-y-scroll');
      expect(filterInnerCard.className).not.toContain('max-h-');

      // Parent container boundaries ensure it stops before footer
      const parentSection = screen.getByTestId('hotel-results-parent');
      expect(parentSection).toContainElement(filterSidebar);
    });

    it('provides accessible collapsible drawer for mobile filters', async () => {
      vi.spyOn(hotelsApi, 'getHotels').mockResolvedValue([mockHotel]);

      render(
        <ToastProvider>
          <LandingPage onSelectHotel={() => {}} />
        </ToastProvider>
      );

      await screen.findByRole('heading', { level: 3, name: 'The Taj Mahal Palace' });

      // Open mobile filter drawer
      const openBtn = screen.getByRole('button', { name: /Open filter options/i });
      expect(openBtn).toBeInTheDocument();
      fireEvent.click(openBtn);

      // Drawer dialog is rendered
      const dialog = screen.getByRole('dialog', { name: /Filter Properties/i });
      expect(dialog).toBeInTheDocument();

      // Press Escape to close
      fireEvent.keyDown(window, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /Filter Properties/i })).not.toBeInTheDocument();
      });
    });
  });
});
