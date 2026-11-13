import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';

export function FilterDrawer({
  availableAmenities = [],
  selectedAmenities = [],
  onToggleAmenity,
  sortBy = 'recommended',
  onSortChange,
  maxPrice = 0,
  currentMaxPrice = 0,
  onPriceChange,
  onResetFilters,
  resultCount = 0,
  isOpen = false,
  onClose,
}) {
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const hasActiveFilters =
    selectedAmenities.length > 0 ||
    sortBy !== 'recommended' ||
    (currentMaxPrice > 0 && currentMaxPrice < maxPrice);

  // Close mobile drawer on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const displayedAmenities = showAllAmenities
    ? availableAmenities
    : availableAmenities.slice(0, 6);

  const filterContent = (
    <div className="space-y-4">
      {/* Sort Section */}
      <div>
        <label htmlFor="sort-select" className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
          Sort By
        </label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full bg-white border border-black/[0.08] rounded-apple px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        >
          <option value="recommended">Recommended</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
        </select>
      </div>

      {/* Max Price Filter */}
      {maxPrice > 0 && (
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
            <span>Max Price</span>
            <span className="text-text-primary text-xs font-bold">
              ₹{currentMaxPrice > 0 ? Number(currentMaxPrice).toLocaleString('en-IN') : Number(maxPrice).toLocaleString('en-IN')}
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max={maxPrice}
            step="500"
            value={currentMaxPrice || maxPrice}
            onChange={(e) => onPriceChange(Number(e.target.value))}
            className="w-full accent-brand-500 cursor-pointer h-1.5"
          />
          <div className="flex justify-between text-[10px] text-text-tertiary mt-0.5">
            <span>₹1,000</span>
            <span>₹{Number(maxPrice).toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {/* Amenities Section with collapsible overflow */}
      {availableAmenities.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Amenities {selectedAmenities.length > 0 ? `(${selectedAmenities.length})` : ''}
            </span>
            {availableAmenities.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAllAmenities(!showAllAmenities)}
                className="text-[10px] text-brand-600 hover:text-brand-700 font-medium"
              >
                {showAllAmenities ? 'Show Less' : `+${availableAmenities.length - 6} more`}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {displayedAmenities.map((amenity) => {
              const isSelected = selectedAmenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => onToggleAmenity(amenity)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1 interactive-tap ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-soft-sm'
                      : 'bg-white text-text-secondary border-black/[0.08] hover:border-black/[0.2] hover:text-text-primary'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  <span>{amenity}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Reset button */}
      {hasActiveFilters && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onResetFilters}
            className="w-full py-1.5 px-2.5 text-[11px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-apple transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Inline Sidebar — Sticky below navbar and search capsule, NO nested scrollbar */}
      <aside
        className="hidden lg:block w-60 xl:w-64 flex-shrink-0 sticky top-44 lg:top-48 z-20 self-start"
        data-testid="filter-sidebar"
        aria-label="Filter hotel properties"
      >
        <div className="bg-white p-4 rounded-apple-xl border border-black/[0.06] shadow-soft-sm">
          <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.06] mb-3.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">Filters</h2>
            </div>
            <span className="text-[11px] text-text-tertiary font-medium">{resultCount} results</span>
          </div>
          {filterContent}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop and Panel */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Filter Properties"
        >
          <div className="w-full max-w-xs bg-white h-full p-5 shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-500" />
                <h2 className="text-sm font-bold text-text-primary">Filters</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full"
                aria-label="Close filters drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">{filterContent}</div>
            <div className="pt-3 border-t border-black/[0.06] mt-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-brand-500 text-white rounded-apple text-xs font-semibold"
              >
                Show {resultCount} Properties
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
