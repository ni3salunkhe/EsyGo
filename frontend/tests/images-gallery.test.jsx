import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as hotelsApi from '../src/api/hotels.js';
import * as bookingsApi from '../src/api/bookings.js';
import { HotelCard } from '../src/components/hotel/HotelCard.jsx';
import { HotelMedia } from '../src/components/common/HotelMedia.jsx';
import { HotelDetailPage } from '../src/pages/HotelDetailPage.jsx';
import { GuestForm } from '../src/components/booking/GuestForm.jsx';
import { HoldReviewModal } from '../src/components/booking/HoldReviewModal.jsx';
import { DemoPaymentModal } from '../src/components/booking/DemoPaymentModal.jsx';
import { BookingConfirmation } from '../src/components/booking/BookingConfirmation.jsx';
import { ManageBookingPage } from '../src/pages/ManageBookingPage.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';

describe('Multiple Hotel Images & Gallery Integration', () => {
  const multiImageHotel = {
    id: 1,
    name: 'The Taj Mahal Palace',
    location: 'Mumbai, Maharashtra',
    address: 'Apollo Bunder, Colaba, Mumbai 400001',
    description: 'Iconic heritage hotel overlooking the Arabian Sea.',
    pricePerNight: 18500,
    availableRooms: 3,
    amenities: ['Free WiFi', 'Pool', 'Fine Dining'],
    // Images sorted in backend display_order ASC: facade, lobby, suite
    images: [
      'https://images.example.com/taj-facade.jpg',
      'https://images.example.com/taj-lobby.jpg',
      'https://images.example.com/taj-suite.jpg',
    ],
    imageUrl: 'https://images.example.com/taj-facade.jpg',
  };

  const singleImageHotel = {
    id: 2,
    name: 'The Oberoi Amarvilas',
    location: 'Agra, Uttar Pradesh',
    address: 'Taj East Gate Road, Agra 282001',
    description: 'Breathtaking uninterrupted views of the Taj Mahal.',
    pricePerNight: 24000,
    availableRooms: 2,
    amenities: ['Taj View', 'Spa', 'Pool'],
    images: ['https://images.example.com/oberoi-view.jpg'],
    imageUrl: 'https://images.example.com/oberoi-view.jpg',
  };

  const noImageHotel = {
    id: 3,
    name: 'Heritage Villa',
    location: 'Jaipur, Rajasthan',
    address: 'Pink City, Jaipur',
    description: 'Charming historic property.',
    pricePerNight: 8000,
    availableRooms: 5,
    amenities: ['WiFi'],
    images: [],
    imageUrl: null,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Hotel Data Model & API Normalization', () => {
    it('normalizes hotel with images[] array in exact display_order ASC and sets primary imageUrl to images[0]', () => {
      const raw = {
        id: 1,
        name: 'The Taj Mahal Palace',
        images: [
          'https://images.example.com/taj-1.jpg',
          'https://images.example.com/taj-2.jpg',
        ],
      };
      const normalized = hotelsApi.normalizeHotel(raw);
      expect(normalized.images).toEqual([
        'https://images.example.com/taj-1.jpg',
        'https://images.example.com/taj-2.jpg',
      ]);
      expect(normalized.imageUrl).toBe('https://images.example.com/taj-1.jpg');
    });

    it('preserves backward compatibility when backend provides legacy imageUrl without images[]', () => {
      const raw = {
        id: 2,
        name: 'The Oberoi Amarvilas',
        imageUrl: 'https://images.example.com/legacy-oberoi.jpg',
      };
      const normalized = hotelsApi.normalizeHotel(raw);
      expect(normalized.imageUrl).toBe('https://images.example.com/legacy-oberoi.jpg');
      expect(normalized.images).toEqual(['https://images.example.com/legacy-oberoi.jpg']);
    });

    it('handles hotels with null or empty images gracefully', () => {
      const raw = {
        id: 3,
        name: 'Heritage Villa',
        imageUrl: null,
        images: null,
      };
      const normalized = hotelsApi.normalizeHotel(raw);
      expect(normalized.images).toEqual([]);
      expect(normalized.imageUrl).toBeNull();
    });
  });

  describe('2. Primary Image Resolution & Photo Count in HotelCard', () => {
    it('uses images[0] as primary image and displays photo counter badge when multiple images exist', () => {
      render(<HotelCard hotel={multiImageHotel} onSelect={() => {}} />);

      const img = screen.getByRole('img', { name: /Exterior or room view of The Taj Mahal Palace/i });
      expect(img).toHaveAttribute('src', 'https://images.example.com/taj-facade.jpg');

      // Check photo counter pill (3 photos)
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByLabelText('3 photos available')).toBeInTheDocument();
    });

    it('does not display photo counter badge when hotel has only one image', () => {
      render(<HotelCard hotel={singleImageHotel} onSelect={() => {}} />);

      const img = screen.getByRole('img', { name: /Exterior or room view of The Oberoi Amarvilas/i });
      expect(img).toHaveAttribute('src', 'https://images.example.com/oberoi-view.jpg');
      expect(screen.queryByLabelText(/photos available/i)).not.toBeInTheDocument();
    });

    it('renders non-photographic fallback when no images exist without fabricating images', () => {
      render(<HotelCard hotel={noImageHotel} onSelect={() => {}} />);

      expect(screen.getByText('Photos coming soon')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /Heritage Villa - photo placeholder/i })).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: /Exterior or room view of Heritage Villa/i })).not.toBeInTheDocument();
    });
  });

  describe('3. Hotel Details Page Gallery & Lightbox', () => {
    it('renders multi-image thumbnail strip respecting display_order ASC and allows selecting active photo', async () => {
      vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(multiImageHotel);

      render(
        <ToastProvider>
          <HotelDetailPage hotelId={1} onBack={() => {}} onProceedToBooking={() => {}} />
        </ToastProvider>
      );

      await screen.findByRole('heading', { level: 1, name: 'The Taj Mahal Palace' });

      // Thumbnail strip should contain 3 thumbnails
      const thumbnails = screen.getAllByRole('button', { name: /View photo \d of 3/i });
      expect(thumbnails).toHaveLength(3);

      // Verify thumbnails are in backend display_order ASC
      expect(screen.getByRole('button', { name: 'View photo 1 of 3' })).toHaveAttribute('aria-current', 'true');
      expect(screen.getByRole('button', { name: 'View photo 2 of 3' })).not.toHaveAttribute('aria-current');

      // Click on photo 2 thumbnail
      fireEvent.click(thumbnails[1]);
      expect(screen.getByRole('button', { name: 'View photo 2 of 3' })).toHaveAttribute('aria-current', 'true');
    });

    it('opens lightbox dialog and supports previous, next navigation and photo counter', async () => {
      vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(multiImageHotel);

      render(
        <ToastProvider>
          <HotelDetailPage hotelId={1} onBack={() => {}} onProceedToBooking={() => {}} />
        </ToastProvider>
      );

      await screen.findByRole('heading', { level: 1, name: 'The Taj Mahal Palace' });

      // Open lightbox
      const galleryBtn = screen.getByRole('button', { name: /View photo gallery \(3 photos\)/i });
      fireEvent.click(galleryBtn);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Check photo counter in lightbox
      expect(screen.getByText('Photo 1 of 3')).toBeInTheDocument();

      // Navigate next
      const nextBtn = screen.getByRole('button', { name: 'Next photo' });
      fireEvent.click(nextBtn);
      expect(screen.getByText('Photo 2 of 3')).toBeInTheDocument();

      // Navigate previous
      const prevBtn = screen.getByRole('button', { name: 'Previous photo' });
      fireEvent.click(prevBtn);
      expect(screen.getByText('Photo 1 of 3')).toBeInTheDocument();

      // Wrap-around on previous from first photo
      fireEvent.click(prevBtn);
      expect(screen.getByText('Photo 3 of 3')).toBeInTheDocument();
    });

    it('supports keyboard ArrowLeft and ArrowRight navigation in lightbox', async () => {
      vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(multiImageHotel);

      render(
        <ToastProvider>
          <HotelDetailPage hotelId={1} onBack={() => {}} onProceedToBooking={() => {}} />
        </ToastProvider>
      );

      await screen.findByRole('heading', { level: 1, name: 'The Taj Mahal Palace' });
      fireEvent.click(screen.getByRole('button', { name: /View photo gallery/i }));

      expect(screen.getByText('Photo 1 of 3')).toBeInTheDocument();

      // Press ArrowRight
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(screen.getByText('Photo 2 of 3')).toBeInTheDocument();

      // Press ArrowLeft
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(screen.getByText('Photo 1 of 3')).toBeInTheDocument();
    });

    it('renders balanced desktop gallery layout constrained to max 1250px with primary 65% and secondary 35%', async () => {
      vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(multiImageHotel);

      render(
        <ToastProvider>
          <HotelDetailPage hotelId={1} onBack={() => {}} onProceedToBooking={() => {}} />
        </ToastProvider>
      );

      await screen.findByRole('heading', { level: 1, name: 'The Taj Mahal Palace' });

      const gallerySection = screen.getByRole('region', { name: 'Hotel photo gallery' });
      expect(gallerySection).toHaveClass('max-w-[1250px]');

      // Check primary image container has 65% width class
      const primaryContainer = gallerySection.querySelector('.md\\:w-\\[65\\%\\]');
      expect(primaryContainer).toBeInTheDocument();

      // Check secondary image container has 35% width class
      const secondaryContainer = gallerySection.querySelector('.md\\:w-\\[35\\%\\]');
      expect(secondaryContainer).toBeInTheDocument();

      // Check height classes (target 300-330px)
      const heightContainer = gallerySection.querySelector('.lg\\:h-\\[320px\\]');
      expect(heightContainer).toBeInTheDocument();
    });

    it('clicking an image opens the lightbox at the clicked image index without navigating away', async () => {
      vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(multiImageHotel);

      render(
        <ToastProvider>
          <HotelDetailPage hotelId={1} onBack={() => {}} onProceedToBooking={() => {}} />
        </ToastProvider>
      );

      await screen.findByRole('heading', { level: 1, name: 'The Taj Mahal Palace' });

      // Click primary image container
      const primaryImg = screen.getByRole('img', { name: /Photo 1 of The Taj Mahal Palace/i });
      fireEvent.click(primaryImg);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Photo 1 of 3')).toBeInTheDocument();

      // Close dialog
      fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Click secondary image 2
      const secondaryImg2 = screen.getByRole('img', { name: /The Taj Mahal Palace photo 2/i });
      fireEvent.click(secondaryImg2);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Photo 2 of 3')).toBeInTheDocument();
    });

    it('renders single-image hotel with full-width container and View Full Photo action without secondary slots', async () => {
      vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(singleImageHotel);

      render(
        <ToastProvider>
          <HotelDetailPage hotelId={2} onBack={() => {}} onProceedToBooking={() => {}} />
        </ToastProvider>
      );

      await screen.findByRole('heading', { level: 1, name: 'The Oberoi Amarvilas' });

      const gallerySection = screen.getByRole('region', { name: 'Hotel photo gallery' });
      expect(gallerySection).toHaveClass('max-w-[1250px]');

      // Should have View Full Photo button
      expect(screen.getByRole('button', { name: /View full photo/i })).toBeInTheDocument();

      // Should not have secondary 35% column
      expect(gallerySection.querySelector('.md\\:w-\\[35\\%\\]')).not.toBeInTheDocument();
      // Should not have thumbnail strip
      expect(screen.queryByRole('region', { name: 'Hotel photo gallery thumbnails' })).not.toBeInTheDocument();
    });

    it('renders 0-image hotel with premium non-photographic fallback and no View Gallery button', async () => {
      vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(noImageHotel);

      render(
        <ToastProvider>
          <HotelDetailPage hotelId={3} onBack={() => {}} onProceedToBooking={() => {}} />
        </ToastProvider>
      );

      await screen.findByRole('heading', { level: 1, name: 'Heritage Villa' });

      expect(screen.getByText('Photos coming soon')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /View photo gallery/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /View full photo/i })).not.toBeInTheDocument();
    });
  });

  describe('4. Image Continuity across Reservation, Payment, and Confirmation', () => {
    const mockHeldBooking = {
      reference: 'BK-TEST-1234',
      status: 'HELD',
      hotelId: 1,
      hotelName: 'The Taj Mahal Palace',
      roomNumber: '204',
      guestName: 'Ananya Roy',
      guestEmail: 'ananya@example.com',
      checkIn: '2026-12-10',
      checkOut: '2026-12-14',
      nights: 4,
      pricePerNight: 18500,
      totalAmount: 74000,
      expiresAt: new Date(Date.now() + 600000).toISOString(),
      createdAt: new Date().toISOString(),
      hotel: multiImageHotel,
    };

    it('maintains hotel image in GuestForm stay summary', () => {
      render(
        <ToastProvider>
          <GuestForm
            hotel={multiImageHotel}
            checkIn="2026-12-10"
            checkOut="2026-12-14"
            nights={4}
            totalAmount={74000}
            onHoldSuccess={() => {}}
            onCancel={() => {}}
          />
        </ToastProvider>
      );

      const img = screen.getByRole('img', { name: /Exterior or room view of The Taj Mahal Palace/i });
      expect(img).toHaveAttribute('src', 'https://images.example.com/taj-facade.jpg');
    });

    it('maintains hotel image in HoldReviewModal', () => {
      render(
        <ToastProvider>
          <HoldReviewModal
            booking={mockHeldBooking}
            onProceedToPayment={() => {}}
            onCancelHold={() => {}}
          />
        </ToastProvider>
      );

      const img = screen.getByRole('img', { name: /Exterior or room view of The Taj Mahal Palace/i });
      expect(img).toHaveAttribute('src', 'https://images.example.com/taj-facade.jpg');
    });

    it('maintains hotel image in DemoPaymentModal', () => {
      render(
        <ToastProvider>
          <DemoPaymentModal
            booking={mockHeldBooking}
            onPaymentSuccess={() => {}}
            onBack={() => {}}
          />
        </ToastProvider>
      );

      const img = screen.getByRole('img', { name: /Exterior or room view of The Taj Mahal Palace/i });
      expect(img).toHaveAttribute('src', 'https://images.example.com/taj-facade.jpg');
    });

    it('maintains hotel image in BookingConfirmation ticket', () => {
      const confirmedBooking = {
        ...mockHeldBooking,
        status: 'CONFIRMED',
      };

      render(
        <ToastProvider>
          <BookingConfirmation
            booking={confirmedBooking}
            onNavigateHome={() => {}}
            onNavigateManage={() => {}}
          />
        </ToastProvider>
      );

      const img = screen.getByRole('img', { name: /Exterior or room view of The Taj Mahal Palace/i });
      expect(img).toHaveAttribute('src', 'https://images.example.com/taj-facade.jpg');
    });
  });

  describe('5. Booking Retrieval uses hotelId to fetch gallery in ManageBookingPage', () => {
    it('retrieves hotel details and renders gallery preview on successful booking lookup', async () => {
      const mockBooking = {
        reference: 'BK-CONF-9999',
        status: 'CONFIRMED',
        hotelId: 1,
        hotelName: 'The Taj Mahal Palace',
        roomNumber: '101',
        guestName: 'Karan Mehra',
        guestEmail: 'karan@example.com',
        checkIn: '2026-12-05',
        checkOut: '2026-12-08',
        nights: 3,
        pricePerNight: 18500,
        totalAmount: 55500,
        createdAt: '2026-11-13T10:00:00.000Z',
      };

      vi.spyOn(bookingsApi, 'getBooking').mockResolvedValue(mockBooking);
      const detailSpy = vi.spyOn(hotelsApi, 'getHotelDetail').mockResolvedValue(multiImageHotel);

      render(
        <ToastProvider>
          <ManageBookingPage onBack={() => {}} onBookAgain={() => {}} />
        </ToastProvider>
      );

      fireEvent.change(screen.getByLabelText(/Booking Reference/i), { target: { value: 'BK-CONF-9999' } });
      fireEvent.change(screen.getByLabelText(/Guest Email/i), { target: { value: 'karan@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /Retrieve Booking/i }));

      await screen.findByText('Reservation Status');

      // Verify hotel details API was called with booking.hotelId
      expect(detailSpy).toHaveBeenCalledWith(1);

      // Verify photo gallery preview is rendered
      expect(screen.getByText(/Property Photo Gallery \(3 photos\)/i)).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Retrieved booking hotel gallery' })).toBeInTheDocument();
    });
  });

  describe('6. Loading Skeleton & Fallback Behavior in HotelMedia', () => {
    it('renders broken-image fallback when image fails to load', async () => {
      render(
        <HotelMedia
          imageUrl="https://images.example.com/broken-url.jpg"
          hotelName="Heritage Villa"
          showName={true}
        />
      );

      const img = screen.getByRole('img', { name: /Exterior or room view of Heritage Villa/i });
      fireEvent.error(img);

      expect(await screen.findByText('Photos coming soon')).toBeInTheDocument();
      expect(screen.getByText('Heritage Villa')).toBeInTheDocument();
    });
  });
});
