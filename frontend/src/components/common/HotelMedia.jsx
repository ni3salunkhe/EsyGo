import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

/**
 * Shared Hotel Media component complying strictly with docs/frontend/IMAGE_LIFECYCLE.md.
 * Renders real hotel photograph when valid imageUrl or images[] is provided.
 * Gracefully displays a shimmer loading skeleton while fetching.
 * Seamlessly falls back to an elegant non-photographic placeholder on null, empty, or load error.
 */
export function HotelMedia({
  imageUrl,
  images = [],
  hotelName = 'Hotel',
  aspectRatio = 'aspect-[16/10]',
  className = '',
  priority = false,
  showBadge = true,
  alt = null,
  showName = true,
}) {
  const [loadFailed, setLoadFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Resolve primary image source: images[0] has priority, falling back to imageUrl
  const resolvedUrl =
    Array.isArray(images) && images.length > 0 && typeof images[0] === 'string' && images[0].trim().length > 0
      ? images[0].trim()
      : typeof imageUrl === 'string' && imageUrl.trim().length > 0
      ? imageUrl.trim()
      : null;

  const hasValidUrl = Boolean(resolvedUrl);
  const showFallback = !hasValidUrl || loadFailed;

  return (
    <div
      className={`relative w-full ${aspectRatio} overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 micro-border rounded-apple-lg ${className}`}
    >
      {showFallback ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center select-none"
          role="img"
          aria-label={`${hotelName} - photo placeholder`}
        >
          {/* Subtle compact geometric backdrop */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/85 shadow-soft-sm border border-black/[0.04] flex items-center justify-center mb-1.5">
            <Building2 className="w-5 h-5 text-gray-400 stroke-[1.5]" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-medium tracking-wide uppercase text-text-tertiary">
            Photos coming soon
          </span>
          {showName && (
            <span className="text-[11px] text-gray-400 mt-0.5 line-clamp-1 max-w-[85%]">
              {hotelName}
            </span>
          )}
        </div>
      ) : (
        <>
          {isLoading && (
            <div
              className="absolute inset-0 animate-pulse bg-gray-200"
              aria-hidden="true"
            />
          )}
          <img
            src={resolvedUrl}
            alt={alt || `Exterior or room view of ${hotelName}`}
            loading={priority ? 'eager' : 'lazy'}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadFailed(true);
            }}
            className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </>
      )}

      {showBadge && (
        <div className="absolute top-2.5 left-2.5 bg-white/85 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-semibold text-text-primary border border-black/[0.06] shadow-soft-sm">
          Verified Property
        </div>
      )}
    </div>
  );
}
