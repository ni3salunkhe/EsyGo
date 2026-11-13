import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, X, AlertCircle } from 'lucide-react';
import { getTodayString, getMaxCheckOutDate, validateDates } from '../../utils/dateUtils.js';

export function SearchCapsule({
  initialQuery = '',
  initialCheckIn = '',
  initialCheckOut = '',
  onSearch,
  onReset,
  loading = false,
}) {
  const [query, setQuery] = useState(initialQuery);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [validationError, setValidationError] = useState(null);

  const today = getTodayString();
  const maxCheckOut = getMaxCheckOutDate(checkIn);

  useEffect(() => {
    setQuery(initialQuery || '');
    setCheckIn(initialCheckIn || '');
    setCheckOut(initialCheckOut || '');
  }, [initialQuery, initialCheckIn, initialCheckOut]);

  // Adjust checkOut if checkIn changes to be after checkOut
  const handleCheckInChange = (newCheckIn) => {
    setCheckIn(newCheckIn || '');
    setValidationError(null);
    if (checkOut && newCheckIn >= checkOut) {
      setCheckOut('');
    }
  };

  const handleCheckOutChange = (newCheckOut) => {
    setCheckOut(newCheckOut || '');
    setValidationError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const err = validateDates(checkIn, checkOut);
    if (err) {
      setValidationError(err);
      return;
    }

    setValidationError(null);
    onSearch({
      query: (query || '').trim(),
      checkIn: checkIn || '',
      checkOut: checkOut || '',
    });
  };

  const handleClear = () => {
    setQuery('');
    setCheckIn('');
    setCheckOut('');
    setValidationError(null);
    onReset();
  };

  const hasActiveFilters = Boolean(query || checkIn || checkOut);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="glass-panel p-2.5 sm:p-3 rounded-apple-xl shadow-soft transition-all"
        role="search"
        aria-label="Hotel search and dates"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          {/* Destination or Hotel Name Field */}
          <div className="md:col-span-5 relative">
            <label htmlFor="search-destination" className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-0.5 ml-1">
              Destination or Hotel
            </label>
            <div className="relative flex items-center bg-white rounded-apple border border-black/[0.08] focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
              <MapPin className="w-3.5 h-3.5 text-gray-400 ml-2.5 flex-shrink-0" aria-hidden="true" />
              <input
                id="search-destination"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="City (e.g. Mumbai) or hotel name"
                className="w-full py-2 px-2.5 text-xs sm:text-sm text-text-primary placeholder:text-gray-400 bg-transparent focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 mr-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                  aria-label="Clear destination input"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Check-In Date Field */}
          <div className="md:col-span-3">
            <label htmlFor="search-check-in" className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-0.5 ml-1">
              Check-In
            </label>
            <div className="relative flex items-center bg-white rounded-apple border border-black/[0.08] focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
              <Calendar className="w-3.5 h-3.5 text-gray-400 ml-2.5 flex-shrink-0 pointer-events-none" aria-hidden="true" />
              <input
                id="search-check-in"
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => handleCheckInChange(e.target.value)}
                className="w-full py-2 px-2 text-xs sm:text-sm text-text-primary bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Check-Out Date Field */}
          <div className="md:col-span-3">
            <label htmlFor="search-check-out" className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-0.5 ml-1">
              Check-Out
            </label>
            <div className="relative flex items-center bg-white rounded-apple border border-black/[0.08] focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
              <Calendar className="w-3.5 h-3.5 text-gray-400 ml-2.5 flex-shrink-0 pointer-events-none" aria-hidden="true" />
              <input
                id="search-check-out"
                type="date"
                min={checkIn || today}
                max={maxCheckOut}
                value={checkOut}
                onChange={(e) => handleCheckOutChange(e.target.value)}
                className="w-full py-2 px-2 text-xs sm:text-sm text-text-primary bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="md:col-span-1 flex md:flex-col justify-end gap-2 pt-1 md:pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium rounded-apple flex items-center justify-center gap-1.5 shadow-soft transition-all interactive-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              aria-label="Search Hotels"
            >
              <Search className="w-4 h-4" />
              <span className="md:hidden">Search</span>
            </button>
          </div>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="mt-2 flex items-center gap-2 text-xs text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-apple border border-rose-200" role="alert">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Active search banner with clear option */}
        {hasActiveFilters && (
          <div className="mt-2 pt-2 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-text-secondary">
            <span>Filtering live catalog by your selections</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-brand-500 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              Reset to Browse All
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
