import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SlidersHorizontal, RefreshCw } from 'lucide-react';
import { getHotels } from '../api/hotels.js';
import { SearchCapsule } from '../components/search/SearchCapsule.jsx';
import { FilterDrawer } from '../components/search/FilterDrawer.jsx';
import { HotelList } from '../components/hotel/HotelList.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function LandingPage({ onSelectHotel, initialDates = {} }) {
  const [apiHotels, setApiHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search capsule parameters
  const [searchParams, setSearchParams] = useState({
    query: '',
    checkIn: initialDates.checkIn || '',
    checkOut: initialDates.checkOut || '',
  });

  // Client filter parameters
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState('recommended');
  const [currentMaxPrice, setCurrentMaxPrice] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { showToast } = useToast();

  // Load hotels from API
  const fetchHotelCatalog = useCallback(async (checkIn = null, checkOut = null) => {
    setLoading(true);
    setError(null);

    try {
      let data = [];
      if (checkIn && checkOut) {
        data = await getHotels({ checkIn, checkOut });
      } else {
        data = await getHotels();
      }
      setApiHotels(data || []);
    } catch (err) {
      setError(err.message || 'Unable to fetch hotels from server.');
      showToast(err.message || 'Failed to load hotels', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Initial browse load
  useEffect(() => {
    fetchHotelCatalog(searchParams.checkIn, searchParams.checkOut);
  }, []);

  // Compute available amenities from live API hotels
  const availableAmenities = useMemo(() => {
    const set = new Set();
    apiHotels.forEach((h) => {
      if (Array.isArray(h.amenities)) {
        h.amenities.forEach((a) => set.add(a));
      }
    });
    return Array.from(set).sort();
  }, [apiHotels]);

  // Compute highest price among live API hotels
  const maxPrice = useMemo(() => {
    if (!apiHotels || apiHotels.length === 0) return 0;
    const prices = apiHotels.map((h) => Number(h.pricePerNight) || 0);
    return Math.max(...prices);
  }, [apiHotels]);

  // Handle Search Capsule submission
  const handleSearch = ({ query, checkIn, checkOut }) => {
    setSearchParams({ query: query || '', checkIn: checkIn || '', checkOut: checkOut || '' });
    fetchHotelCatalog(checkIn || null, checkOut || null);
  };

  // Reset to default browse all
  const handleResetSearch = () => {
    setSearchParams({ query: '', checkIn: '', checkOut: '' });
    setSelectedAmenities([]);
    setSortBy('recommended');
    setCurrentMaxPrice(0);
    fetchHotelCatalog(null, null);
  };

  // Reset local filters only
  const handleResetFilters = () => {
    setSelectedAmenities([]);
    setSortBy('recommended');
    setCurrentMaxPrice(0);
  };

  const handleToggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  // Filter & Sort Pipeline
  const filteredHotels = useMemo(() => {
    let result = [...apiHotels];

    // 1. Text filter on name or location (case-insensitive substring)
    const q = searchParams.query.trim().toLowerCase();
    if (q) {
      result = result.filter((h) => {
        const nameMatch = h.name && h.name.toLowerCase().includes(q);
        const locMatch = h.location && h.location.toLowerCase().includes(q);
        return nameMatch || locMatch;
      });
    }

    // 2. Amenities filter (must possess all selected amenities)
    if (selectedAmenities.length > 0) {
      result = result.filter((h) => {
        const hotelAmenities = Array.isArray(h.amenities) ? h.amenities : [];
        return selectedAmenities.every((amenity) => hotelAmenities.includes(amenity));
      });
    }

    // 3. Price per night filter
    if (currentMaxPrice > 0) {
      result = result.filter((h) => Number(h.pricePerNight) <= currentMaxPrice);
    }

    // 4. Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => Number(a.pricePerNight) - Number(b.pricePerNight));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => Number(b.pricePerNight) - Number(a.pricePerNight));
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [apiHotels, searchParams.query, selectedAmenities, currentMaxPrice, sortBy]);

  const hasDates = Boolean(searchParams.checkIn && searchParams.checkOut);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5 px-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary leading-[1.15]">
          Where luxury meets peace of mind.
        </h1>
        <p className="text-sm sm:text-base text-text-secondary max-w-lg mx-auto">
          Explore India's premier properties with real-time MySQL inventory holds and guaranteed availability.
        </p>
      </div>

      {/* Unified Search Capsule — Sticky below navbar, smooth native scroll */}
      <div
        className="sticky top-16 sm:top-20 z-30 py-2 sm:py-2.5 bg-[#f5f5f7] border-b border-black/[0.04] transition-all"
        data-testid="sticky-search-wrapper"
      >
        <SearchCapsule
          initialQuery={searchParams.query}
          initialCheckIn={searchParams.checkIn}
          initialCheckOut={searchParams.checkOut}
          onSearch={handleSearch}
          onReset={handleResetSearch}
          loading={loading}
        />
      </div>

      {/* Main Content Area: Sidebar + Compact Full-width Horizontal Hotel Listing */}
      <div className="pt-1 sm:pt-2">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between mb-3 px-1">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-apple border border-black/[0.08] text-xs font-semibold text-text-primary shadow-soft-sm interactive-tap"
            aria-label="Open filter options"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-500" />
            <span>Filters {selectedAmenities.length > 0 ? `(${selectedAmenities.length})` : ''}</span>
          </button>
          <span className="text-xs text-text-tertiary">
            {filteredHotels.length} of {apiHotels.length} properties
          </span>
        </div>

        {/* Server Error State */}
        {error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-apple-xl p-8 text-center max-w-md mx-auto space-y-4">
            <h3 className="text-base font-bold text-rose-800">Connection Error</h3>
            <p className="text-xs sm:text-sm text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => fetchHotelCatalog(searchParams.checkIn, searchParams.checkOut)}
              className="px-4 py-2 bg-rose-600 text-white rounded-apple text-xs font-semibold hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5 shadow-soft-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative" data-testid="hotel-results-parent">
            {/* Desktop Filters Rail (No nested scrollbar) & Mobile Drawer */}
            <FilterDrawer
              availableAmenities={availableAmenities}
              selectedAmenities={selectedAmenities}
              onToggleAmenity={handleToggleAmenity}
              sortBy={sortBy}
              onSortChange={setSortBy}
              maxPrice={maxPrice}
              currentMaxPrice={currentMaxPrice}
              onPriceChange={setCurrentMaxPrice}
              onResetFilters={handleResetFilters}
              resultCount={filteredHotels.length}
              isOpen={mobileFilterOpen}
              onClose={() => setMobileFilterOpen(false)}
            />

            {/* Compact Full-width Horizontal Hotel Listing */}
            <div className="flex-1 w-full min-w-0">
              <HotelList
                hotels={filteredHotels}
                loading={loading}
                hasDates={hasDates}
                totalApiHotels={apiHotels.length}
                onResetFilters={handleResetSearch}
                onSelectHotel={(id) =>
                  onSelectHotel(id, {
                    checkIn: searchParams.checkIn,
                    checkOut: searchParams.checkOut,
                  })
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
