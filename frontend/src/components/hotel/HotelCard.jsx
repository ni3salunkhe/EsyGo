import React from 'react';
import { MapPin, ArrowRight, Images } from 'lucide-react';
import { HotelMedia } from '../common/HotelMedia.jsx';

export function HotelCard({ hotel, hasDates = false, onSelect }) {
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
    nights,
    totalAmount,
  } = hotel;

  const isSoldOut = hasDates && availableRooms === 0;

  // Resolve primary image from images[0], preserving backward compatibility with imageUrl
  const resolvedImages = Array.isArray(images) && images.length > 0 ? images : (imageUrl ? [imageUrl] : []);
  const primaryImage = resolvedImages[0] || null;
  const imageCount = resolvedImages.length;

  return (
    <article
      onClick={() => onSelect(id)}
      className="glass-card rounded-apple-lg overflow-hidden flex flex-col md:flex-row cursor-pointer group focus-within:ring-2 focus-within:ring-brand-500 transition-all hover:shadow-soft-md"
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(id);
        }
      }}
      aria-label={`View details for ${name} in ${location}`}
    >
      {/* Left Section: Compact Lead Photo / Fallback */}
      <div
        data-testid="hotel-card-media"
        className="relative w-full md:w-60 lg:w-64 flex-shrink-0 overflow-hidden bg-gray-100 self-stretch"
      >
        <div className="h-40 sm:h-44 md:h-full w-full">
          <HotelMedia
            imageUrl={primaryImage}
            images={resolvedImages}
            hotelName={name}
            aspectRatio="w-full h-full"
            className="w-full h-full !rounded-none"
            showBadge={false}
            showName={false}
          />
        </div>

        {/* Gallery count pill when multiple images exist */}
        {imageCount > 1 && (
          <div
            className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-md shadow-soft-sm flex items-center gap-1 pointer-events-none"
            aria-label={`${imageCount} photos available`}
          >
            <Images className="w-3 h-3" />
            <span>{imageCount}</span>
          </div>
        )}

        {/* Search Mode Availability Badge */}
        {hasDates && typeof availableRooms === 'number' && (
          <div
            className={`absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md shadow-soft-sm border ${
              isSoldOut
                ? 'bg-rose-500/90 text-white border-rose-600'
                : availableRooms <= 2
                ? 'bg-amber-500/90 text-white border-amber-600'
                : 'bg-emerald-600/90 text-white border-emerald-700'
            }`}
          >
            {isSoldOut ? 'Sold Out' : `${availableRooms} room${availableRooms > 1 ? 's' : ''} available`}
          </div>
        )}
      </div>

      {/* Right Section: Compact Property Details & Actions */}
      <div
        data-testid="hotel-card-content"
        className="p-4 sm:p-5 flex-1 flex flex-col justify-between min-w-0"
      >
        <div>
          {/* Location & Status Line */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 uppercase tracking-wider">
              <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{location}</span>
            </div>
            {hasDates && typeof availableRooms === 'number' && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isSoldOut
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : availableRooms <= 2
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {isSoldOut ? 'Sold Out' : `${availableRooms} left`}
              </span>
            )}
          </div>

          {/* Hotel Name */}
          <h3 className="text-base sm:text-lg font-bold text-text-primary tracking-tight group-hover:text-brand-500 transition-colors line-clamp-1">
            {name}
          </h3>

          {/* Address Snippet */}
          {address && (
            <p className="text-[11px] text-text-tertiary line-clamp-1 mt-0.5">
              {address}
            </p>
          )}

          {/* Short Description */}
          {description && (
            <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mt-1">
              {description}
            </p>
          )}

          {/* Selected Amenities Pills (Compact) */}
          {amenities && amenities.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {amenities.slice(0, 4).map((amenity) => (
                <span
                  key={amenity}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-text-secondary border border-black/[0.04]"
                >
                  {amenity}
                </span>
              ))}
              {amenities.length > 4 && (
                <span className="px-1 text-[10px] text-text-tertiary font-medium">
                  +{amenities.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing & CTA Line */}
        <div className="pt-2.5 mt-2.5 border-t border-black/[0.06] flex items-end justify-between gap-3">
          <div>
            <span className="text-[10px] text-text-tertiary block leading-none">Starting from</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-xl font-bold text-text-primary">
                ₹{Number(pricePerNight).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-text-secondary font-medium">/ night</span>
            </div>

            {/* Total Amount in Search Mode */}
            {hasDates && totalAmount && nights && (
              <span className="text-[10px] text-text-tertiary block font-medium mt-0.5">
                Total ₹{Number(totalAmount).toLocaleString('en-IN')} ({nights} night{nights > 1 ? 's' : ''})
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isSoldOut}
            className={`px-3.5 py-2 rounded-apple text-xs font-semibold flex items-center gap-1.5 transition-all interactive-tap flex-shrink-0 ${
              isSoldOut
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-brand-500 shadow-soft-sm'
            }`}
          >
            <span>{isSoldOut ? 'Sold Out' : 'View Details'}</span>
            {!isSoldOut && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </article>
  );
}
