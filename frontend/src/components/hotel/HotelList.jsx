import React from 'react';
import { SearchX, Building2, RotateCcw } from 'lucide-react';
import { HotelCard } from './HotelCard.jsx';
import { HotelCardSkeleton } from '../common/Skeleton.jsx';

export function HotelList({
  hotels = [],
  loading = false,
  hasDates = false,
  totalApiHotels = 0,
  onResetFilters,
  onSelectHotel,
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4 sm:gap-4.5" aria-busy="true" aria-label="Loading hotels">
        {Array.from({ length: 4 }).map((_, idx) => (
          <HotelCardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  // Case 1: Backend returned 0 results
  if (totalApiHotels === 0) {
    return (
      <div className="bg-white rounded-apple-xl border border-black/[0.06] p-8 sm:p-12 text-center max-w-lg mx-auto shadow-soft-sm space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Building2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-text-primary">
          {hasDates ? 'No Rooms Available for These Dates' : 'No Hotels Found'}
        </h3>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          {hasDates
            ? 'All rooms are fully booked for the requested period. Try adjusting your dates or browsing without dates to view all properties.'
            : 'No hotel properties are currently listed in the system catalog.'}
        </p>
        {hasDates && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 bg-brand-500 text-white rounded-apple text-xs font-semibold hover:bg-brand-600 transition-colors shadow-soft-sm"
          >
            Browse All Hotels
          </button>
        )}
      </div>
    );
  }

  // Case 2: Backend returned results, but client filters narrowed them to 0
  if (hotels.length === 0) {
    return (
      <div className="bg-white rounded-apple-xl border border-black/[0.06] p-8 sm:p-12 text-center max-w-lg mx-auto shadow-soft-sm space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
          <SearchX className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-text-primary">No Matching Hotels</h3>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          None of the {totalApiHotels} available properties match your active filter criteria. Try loosening your price or amenity selections.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="px-4 py-2 bg-black text-white rounded-apple text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1.5 mx-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>
    );
  }

  // Case 3: Compact full-width horizontal list of cards
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between text-xs text-text-tertiary px-1">
        <span>Showing {hotels.length} of {totalApiHotels} properties</span>
        {hasDates && <span className="text-emerald-700 font-medium">&bull; Live Date Availability</span>}
      </div>

      <div className="flex flex-col gap-4 sm:gap-4.5" data-testid="hotel-card-list">
        {hotels.map((hotel) => (
          <HotelCard
            key={hotel.id}
            hotel={hotel}
            hasDates={hasDates}
            onSelect={onSelectHotel}
          />
        ))}
      </div>
    </div>
  );
}
