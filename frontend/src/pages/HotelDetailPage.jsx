import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Maximize2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Images,
} from 'lucide-react';
import { getHotelDetail } from '../api/hotels.js';
import { HotelMedia } from '../components/common/HotelMedia.jsx';
import { Dialog } from '../components/common/Dialog.jsx';
import { HotelDetailSkeleton } from '../components/common/Skeleton.jsx';
import { getTodayString, getMaxCheckOutDate, validateDates, calculateNights, formatDisplayDate } from '../utils/dateUtils.js';
import { useToast } from '../context/ToastContext.jsx';

export function HotelDetailPage({
  hotelId,
  initialDates = {},
  onBack,
  onProceedToBooking,
}) {
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stay dates state
  const [checkIn, setCheckIn] = useState(initialDates.checkIn || '');
  const [checkOut, setCheckOut] = useState(initialDates.checkOut || '');
  const [dateError, setDateError] = useState(null);

  // Photo gallery & lightbox state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { showToast } = useToast();
  const today = getTodayString();
  const maxCheckOut = getMaxCheckOutDate(checkIn);

  // Fetch hotel details from API
  const fetchDetail = useCallback(async (cIn, cOut) => {
    if (!hotelId) return;
    setLoading(true);
    setError(null);

    try {
      const dates = (cIn && cOut) ? { checkIn: cIn, checkOut: cOut } : {};
      const data = await getHotelDetail(hotelId, dates);
      setHotel(data);
      setActiveImageIndex(0); // Reset gallery index on hotel change
    } catch (err) {
      setError(err.message || 'Unable to retrieve hotel details.');
      showToast(err.message || 'Failed to load hotel details', 'error');
    } finally {
      setLoading(false);
    }
  }, [hotelId, showToast]);

  useEffect(() => {
    fetchDetail(checkIn, checkOut);
  }, [fetchDetail]);

  const handleApplyDates = (e) => {
    e.preventDefault();
    const err = validateDates(checkIn, checkOut);
    if (err) {
      setDateError(err);
      return;
    }
    setDateError(null);
    fetchDetail(checkIn, checkOut);
  };

  const handleCheckInChange = (newCheckIn) => {
    setCheckIn(newCheckIn);
    setDateError(null);
    if (checkOut && newCheckIn >= checkOut) {
      setCheckOut('');
    }
  };

  const handleCheckOutChange = (newCheckOut) => {
    setCheckOut(newCheckOut);
    setDateError(null);
  };

  // Keyboard navigation for lightbox gallery
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e) => {
      const images = Array.isArray(hotel?.images) && hotel.images.length > 0
        ? hotel.images
        : (hotel?.imageUrl ? [hotel.imageUrl] : []);

      if (images.length <= 1) return;

      if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, hotel]);

  if (loading) {
    return <HotelDetailSkeleton />;
  }

  if (error || !hotel) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-apple-xl border border-black/[0.06] shadow-soft-sm text-center space-y-4 my-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Hotel Unavailable</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          {error || 'The requested hotel property could not be loaded from the database catalog.'}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-black text-white rounded-apple text-xs font-semibold hover:bg-gray-800 transition-colors inline-flex items-center gap-1.5 shadow-soft-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Hotels Catalog</span>
        </button>
      </div>
    );
  }

  const {
    id,
    name,
    location,
    address,
    description,
    imageUrl,
    images = [],
    amenities = [],
    pricePerNight,
    availableRooms,
    nights: serverNights,
    totalAmount: serverTotalAmount,
  } = hotel;

  // Resolve gallery images in exact backend display_order ASC; maintain backward compatibility with imageUrl
  const resolvedImages = Array.isArray(images) && images.length > 0
    ? images
    : (imageUrl ? [imageUrl] : []);

  const activeImageUrl = resolvedImages[activeImageIndex] || resolvedImages[0] || null;

  // Search mode check
  const hasDatesSelected = Boolean(checkIn && checkOut);
  const clientNights = hasDatesSelected ? calculateNights(checkIn, checkOut) : 0;
  const clientEstimatedTotal = clientNights * Number(pricePerNight);

  const displayNights = typeof serverNights === 'number' ? serverNights : clientNights;
  const displayTotal = serverTotalAmount !== undefined && serverTotalAmount !== null
    ? Number(serverTotalAmount)
    : clientEstimatedTotal;

  // Availability gate: only sold out if dates are selected and availableRooms === 0
  const isSoldOut = hasDatesSelected && availableRooms === 0;

  const handleStartBooking = () => {
    if (!hasDatesSelected || isSoldOut) return;

    onProceedToBooking(hotel, {
      checkIn,
      checkOut,
      nights: displayNights,
      totalAmount: displayTotal,
    });
  };

  const handleOpenLightbox = (index = 0) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-apple hover:bg-black/[0.04] transition-colors"
          aria-label="Back to hotel search results"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Hotels</span>
        </button>

        {hasDatesSelected && typeof availableRooms === 'number' && (
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border shadow-soft-sm ${
              isSoldOut
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : availableRooms <= 2
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {isSoldOut ? 'Sold Out for Selected Dates' : `${availableRooms} room${availableRooms > 1 ? 's' : ''} available`}
          </div>
        )}
      </div>

      {/* Property Title & Nightly Rate Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-black/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{location}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            {name}
          </h1>
          {address && (
            <p className="text-xs sm:text-sm text-text-tertiary">
              {address}
            </p>
          )}
        </div>

        {/* Nightly rate banner */}
        <div className="text-left md:text-right">
          <span className="text-xs text-text-tertiary block">Price per night</span>
          <div className="flex items-baseline md:justify-end gap-1 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              ₹{Number(pricePerNight).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-text-secondary font-medium">/ night</span>
          </div>
        </div>
      </div>

      {/* Lead Media Area with Photo Gallery & Lightbox */}
      <section
        className="max-w-[1250px] mx-auto w-full space-y-2.5"
        aria-label="Hotel photo gallery"
      >
        {resolvedImages.length === 0 ? (
          /* Empty image fallback - single compact placeholder container */
          <div className="h-[220px] sm:h-[260px] md:h-[310px] lg:h-[320px] w-full rounded-apple-xl overflow-hidden shadow-soft-sm micro-border">
            <HotelMedia
              imageUrl={null}
              hotelName={name}
              aspectRatio="w-full h-full"
              className="w-full h-full !rounded-none"
              showBadge={true}
              showName={true}
            />
          </div>
        ) : resolvedImages.length === 1 ? (
          /* Single image layout: spans 100% width, target height 300-320px on desktop */
          <div className="relative group rounded-apple-xl overflow-hidden shadow-soft-sm micro-border h-[220px] sm:h-[260px] md:h-[310px] lg:h-[320px] w-full bg-gray-100">
            <div
              className="w-full h-full cursor-pointer"
              onClick={() => handleOpenLightbox(0)}
            >
              <HotelMedia
                imageUrl={resolvedImages[0]}
                hotelName={name}
                aspectRatio="w-full h-full"
                className="w-full h-full !rounded-none cursor-pointer"
                priority={true}
                showBadge={true}
                showName={false}
                alt={`Lead view of ${name}`}
              />
            </div>
            <button
              type="button"
              onClick={() => handleOpenLightbox(0)}
              className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-text-primary border border-black/[0.08] shadow-soft-sm flex items-center gap-1.5 hover:bg-white transition-all interactive-tap z-10"
              aria-label="View full photo"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>View Full Photo</span>
            </button>
          </div>
        ) : (
          /* Multi-image layout: 65% Primary + 35% Secondary on Desktop/Tablet */
          <div className="relative">
            <div className="flex flex-col md:flex-row gap-2.5 h-[220px] sm:h-[260px] md:h-[310px] lg:h-[320px] w-full rounded-apple-xl overflow-hidden shadow-soft-sm">
              {/* Primary Image: ~65% width on desktop, 100% on mobile */}
              <div
                className="relative w-full md:w-[65%] h-full rounded-apple-xl overflow-hidden bg-gray-100 group cursor-pointer micro-border"
                onClick={() => handleOpenLightbox(activeImageIndex)}
              >
                <HotelMedia
                  imageUrl={activeImageUrl || resolvedImages[0]}
                  hotelName={name}
                  aspectRatio="w-full h-full"
                  className="w-full h-full !rounded-none cursor-pointer"
                  priority={true}
                  showBadge={true}
                  showName={false}
                  alt={`Photo ${activeImageIndex + 1} of ${name}`}
                />
              </div>

              {/* Secondary Images: ~35% width, stacked vertically (hidden on mobile, visible on md+) */}
              <div className="hidden md:flex md:w-[35%] flex-col gap-2.5 h-full">
                {resolvedImages.length === 2 ? (
                  /* 1 secondary image filling full vertical height of the 35% column */
                  <div
                    className="relative flex-1 h-full rounded-apple-xl overflow-hidden bg-gray-100 group cursor-pointer micro-border"
                    onClick={() => handleOpenLightbox(1)}
                  >
                    <HotelMedia
                      imageUrl={resolvedImages[1]}
                      hotelName={name}
                      aspectRatio="w-full h-full"
                      className="w-full h-full !rounded-none cursor-pointer"
                      priority={false}
                      showBadge={false}
                      showName={false}
                      alt={`${name} photo 2`}
                    />
                  </div>
                ) : (
                  /* 2 secondary images stacked vertically (50% height each) */
                  <>
                    <div
                      className="relative flex-1 min-h-0 rounded-apple-xl overflow-hidden bg-gray-100 group cursor-pointer micro-border"
                      onClick={() => handleOpenLightbox(1)}
                    >
                      <HotelMedia
                        imageUrl={resolvedImages[1]}
                        hotelName={name}
                        aspectRatio="w-full h-full"
                        className="w-full h-full !rounded-none cursor-pointer"
                        priority={false}
                        showBadge={false}
                        showName={false}
                        alt={`${name} photo 2`}
                      />
                    </div>
                    <div
                      className="relative flex-1 min-h-0 rounded-apple-xl overflow-hidden bg-gray-100 group cursor-pointer micro-border"
                      onClick={() => handleOpenLightbox(2)}
                    >
                      <HotelMedia
                        imageUrl={resolvedImages[2]}
                        hotelName={name}
                        aspectRatio="w-full h-full"
                        className="w-full h-full !rounded-none cursor-pointer"
                        priority={false}
                        showBadge={false}
                        showName={false}
                        alt={`${name} photo 3`}
                      />
                      {resolvedImages.length > 3 && (
                        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center text-white font-bold text-xs sm:text-sm tracking-wide transition-colors group-hover:bg-black/55 pointer-events-none">
                          +{resolvedImages.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* View Gallery Action Button */}
            <button
              type="button"
              onClick={() => handleOpenLightbox(activeImageIndex)}
              className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-text-primary border border-black/[0.08] shadow-soft-sm flex items-center gap-1.5 hover:bg-white transition-all interactive-tap z-10"
              aria-label={`View photo gallery (${resolvedImages.length} photos)`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>View Gallery ({resolvedImages.length})</span>
            </button>
          </div>
        )}

        {/* Thumbnail Navigation Strip (Accessible for touch navigation and mobile swipe) */}
        {resolvedImages.length > 1 && (
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1"
            role="region"
            aria-label="Hotel photo gallery thumbnails"
          >
            {resolvedImages.map((imgUrl, idx) => {
              const isSelected = idx === activeImageIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 sm:w-20 aspect-[4/3] rounded-apple overflow-hidden flex-shrink-0 border transition-all ${
                    isSelected
                      ? 'ring-2 ring-brand-500 border-transparent shadow-soft'
                      : 'border-black/[0.08] opacity-75 hover:opacity-100 hover:border-black/[0.2]'
                  }`}
                  aria-label={`View photo ${idx + 1} of ${resolvedImages.length}`}
                  aria-current={isSelected ? 'true' : undefined}
                >
                  <img
                    src={imgUrl}
                    alt={`${name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Two Column Layout: Details on Left, Booking Capsule on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Description & Amenities */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          {/* Description */}
          <div className="bg-white p-6 sm:p-8 rounded-apple-xl border border-black/[0.06] shadow-soft-sm space-y-4">
            <h2 className="text-lg font-bold text-text-primary tracking-tight">About the Property</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              {description || 'Experience refined comfort and authentic luxury hospitality at this premier destination.'}
            </p>
            <div className="pt-4 border-t border-black/[0.06] flex items-center gap-2 text-xs text-text-tertiary">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>Standard luxury room category &bull; 1 room per reservation</span>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white p-6 sm:p-8 rounded-apple-xl border border-black/[0.06] shadow-soft-sm space-y-4">
            <h2 className="text-lg font-bold text-text-primary tracking-tight">Hotel Amenities</h2>
            {amenities && amenities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 p-2.5 rounded-apple bg-surface-bg border border-black/[0.04] text-xs font-medium text-text-primary"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-tertiary">Standard hotel amenities included.</p>
            )}
          </div>
        </div>

        {/* Right Column: Reservation & Availability Evaluation Capsule */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-white p-6 sm:p-7 rounded-apple-xl border border-black/[0.08] shadow-glass space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary block">
                Stay Dates
              </span>
              <p className="text-xs text-text-secondary mt-0.5">
                Select your dates to verify live MySQL inventory availability.
              </p>
            </div>

            {/* Date Pickers Form */}
            <form onSubmit={handleApplyDates} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="detail-check-in" className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1 ml-0.5">
                    Check-In
                  </label>
                  <div className="relative flex items-center bg-surface-bg rounded-apple border border-black/[0.08] focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                    <Calendar className="w-4 h-4 text-gray-400 ml-2.5 flex-shrink-0 pointer-events-none" aria-hidden="true" />
                    <input
                      id="detail-check-in"
                      type="date"
                      min={today}
                      value={checkIn}
                      onChange={(e) => handleCheckInChange(e.target.value)}
                      className="w-full py-2 px-2 text-xs font-medium text-text-primary bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="detail-check-out" className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1 ml-0.5">
                    Check-Out
                  </label>
                  <div className="relative flex items-center bg-surface-bg rounded-apple border border-black/[0.08] focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                    <Calendar className="w-4 h-4 text-gray-400 ml-2.5 flex-shrink-0 pointer-events-none" aria-hidden="true" />
                    <input
                      id="detail-check-out"
                      type="date"
                      min={checkIn || today}
                      max={maxCheckOut}
                      value={checkOut}
                      onChange={(e) => handleCheckOutChange(e.target.value)}
                      className="w-full py-2 px-2 text-xs font-medium text-text-primary bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {dateError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-apple border border-rose-200" role="alert">
                  {dateError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-text-primary rounded-apple text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Check Availability</span>
              </button>
            </form>

            {/* Stay Summary (only displayed when dates are selected) */}
            {hasDatesSelected && (
              <div className="pt-4 border-t border-black/[0.06] space-y-3 text-xs">
                <div className="flex justify-between items-center text-text-secondary">
                  <span>Selected Stay</span>
                  <span className="font-semibold text-text-primary">
                    {displayNights} night{displayNights > 1 ? 's' : ''} ({formatDisplayDate(checkIn)} &ndash; {formatDisplayDate(checkOut)})
                  </span>
                </div>

                <div className="flex justify-between items-center text-text-secondary">
                  <span>Nightly Rate</span>
                  <span>₹{Number(pricePerNight).toLocaleString('en-IN')} &times; {displayNights}</span>
                </div>

                <div className="pt-2 border-t border-black/[0.04] flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Total Amount</span>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-brand-600">
                      ₹{displayTotal.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-text-tertiary block">Taxes included</span>
                  </div>
                </div>

                {/* Status Notice */}
                {isSoldOut ? (
                  <div className="p-3 rounded-apple bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Sold Out for Selected Period</span>
                      <span>All rooms for this property are fully booked for these dates. Please try another period.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-apple bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Rooms available. 10-minute hold starts upon proceeding.</span>
                  </div>
                )}
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-2">
              {isSoldOut ? (
                <button
                  type="button"
                  disabled
                  aria-label="Sold out for selected dates"
                  className="w-full py-3.5 bg-rose-100 text-rose-400 font-bold rounded-apple text-sm cursor-not-allowed border border-rose-200 shadow-none"
                >
                  Sold Out
                </button>
              ) : hasDatesSelected ? (
                <button
                  type="button"
                  onClick={handleStartBooking}
                  className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-apple text-sm shadow-soft transition-all interactive-tap flex items-center justify-center gap-2"
                >
                  <span>Reserve Room • Start 10-Min Hold</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 bg-gray-100 text-gray-400 font-bold rounded-apple text-sm cursor-not-allowed border border-gray-200"
                >
                  Select Check-in and Check-out to Book
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal with Multi-Image Gallery Navigation */}
      {activeImageUrl && (
        <Dialog
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          title={name}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-apple-lg bg-black/5 flex items-center justify-center min-h-[300px]">
              <img
                src={activeImageUrl}
                alt={resolvedImages.length > 1 ? `Full view of ${name} - photo ${activeImageIndex + 1}` : `Full view of ${name}`}
                className="w-full h-auto max-h-[70vh] object-contain mx-auto"
              />

              {/* Previous Photo Button */}
              {resolvedImages.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === 0 ? resolvedImages.length - 1 : prev - 1))
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-text-primary shadow-soft hover:bg-white transition-all interactive-tap"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Next Photo Button */}
              {resolvedImages.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === resolvedImages.length - 1 ? 0 : prev + 1))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-text-primary shadow-soft hover:bg-white transition-all interactive-tap"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Lightbox Footer with Photo Counter and Thumbnail Navigation */}
            {resolvedImages.length > 1 && (
              <div className="flex items-center justify-between text-xs text-text-secondary px-1">
                <span className="font-medium">
                  Photo {activeImageIndex + 1} of {resolvedImages.length}
                </span>
                <div className="flex gap-1.5">
                  {resolvedImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === activeImageIndex ? 'bg-brand-500 w-5' : 'bg-gray-300 hover:bg-gray-400 w-2'
                      }`}
                      aria-label={`Jump to photo ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
