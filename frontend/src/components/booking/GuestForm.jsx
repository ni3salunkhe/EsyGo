import React, { useState } from 'react';
import { User, Mail, ShieldAlert, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { reserveBooking } from '../../api/bookings.js';
import { HotelMedia } from '../common/HotelMedia.jsx';
import { formatDisplayDate } from '../../utils/dateUtils.js';
import { useToast } from '../../context/ToastContext.jsx';

export function GuestForm({
  hotel,
  checkIn,
  checkOut,
  nights,
  totalAmount,
  onHoldSuccess,
  onCancel,
}) {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const { showToast } = useToast();

  const validateLocal = () => {
    const errors = {};
    const trimmedName = guestName.trim();
    const trimmedEmail = guestEmail.trim();

    if (!trimmedName) {
      errors.guestName = 'Guest name is required.';
    } else if (trimmedName.length > 100) {
      errors.guestName = 'Guest name cannot exceed 100 characters.';
    }

    if (!trimmedEmail) {
      errors.guestEmail = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.guestEmail = 'Please provide a valid email address.';
    } else if (trimmedEmail.length > 150) {
      errors.guestEmail = 'Email address cannot exceed 150 characters.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const localErrors = validateLocal();
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    setFieldErrors({});
    setServerError(null);
    setSubmitting(true);

    try {
      // Payload strictly contains: hotelId, checkIn, checkOut, guestName, guestEmail
      // Backend calculates pricing and assigns room atomically.
      const bookingResponse = await reserveBooking({
        hotelId: hotel.id,
        checkIn,
        checkOut,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
      });

      showToast(`10-Minute Hold Secured! Reference: ${bookingResponse.reference}`, 'success');
      onHoldSuccess(bookingResponse);
    } catch (err) {
      setServerError(err.message || 'Failed to reserve room.');
      if (err.fieldErrors && Array.isArray(err.fieldErrors)) {
        const mapped = {};
        err.fieldErrors.forEach((fe) => {
          if (fe.field) mapped[fe.field] = fe.message;
        });
        setFieldErrors(mapped);
      }
      showToast(err.message || 'Reservation hold could not be created', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-apple-xl border border-black/[0.08] shadow-soft-lg space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary block">
            Step 1 of 2
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            Guest Details
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-apple hover:bg-gray-100 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Hotel</span>
        </button>
      </div>

      {/* Stay Summary Card with Hotel Media Continuity */}
      <div className="bg-surface-bg p-4 sm:p-5 rounded-apple border border-black/[0.04] space-y-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-apple overflow-hidden flex-shrink-0 bg-gray-100">
              <HotelMedia
                imageUrl={hotel?.images?.[0] || hotel?.imageUrl}
                hotelName={hotel?.name}
                aspectRatio="w-full h-full"
                className="w-full h-full !rounded-none"
                showBadge={false}
                showName={false}
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-text-primary truncate">{hotel.name}</h3>
              <p className="text-xs text-text-tertiary truncate">{hotel.location}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-500 text-white shadow-soft-sm flex-shrink-0">
            Standard Luxury Room
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-black/[0.06] text-xs">
          <div>
            <span className="text-text-tertiary block">Stay Duration</span>
            <span className="font-semibold text-text-primary">
              {nights} night{nights > 1 ? 's' : ''} ({formatDisplayDate(checkIn)} &ndash; {formatDisplayDate(checkOut)})
            </span>
          </div>
          <div className="text-right">
            <span className="text-text-tertiary block">Server Total</span>
            <span className="font-bold text-base text-text-primary">
              ₹{Number(totalAmount).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="p-4 rounded-apple bg-rose-50 border border-rose-200 flex items-start gap-3" role="alert">
          <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800 space-y-1">
            <span className="font-bold block">Unable to create reservation</span>
            <p>{serverError}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Full Name */}
        <div className="space-y-1">
          <label htmlFor="guest-name" className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center bg-surface-bg rounded-apple border border-black/[0.08] focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
            <User className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" aria-hidden="true" />
            <input
              id="guest-name"
              type="text"
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, guestName: null }));
              }}
              placeholder="e.g. Priya Sharma"
              maxLength={100}
              required
              className="w-full py-2.5 px-3 text-sm text-text-primary bg-transparent focus:outline-none"
              aria-invalid={Boolean(fieldErrors.guestName)}
              aria-describedby={fieldErrors.guestName ? 'guest-name-error' : undefined}
            />
          </div>
          {fieldErrors.guestName && (
            <p id="guest-name-error" className="text-xs text-rose-600 ml-1 mt-1 font-medium">
              {fieldErrors.guestName}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label htmlFor="guest-email" className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center bg-surface-bg rounded-apple border border-black/[0.08] focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
            <Mail className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" aria-hidden="true" />
            <input
              id="guest-email"
              type="email"
              value={guestEmail}
              onChange={(e) => {
                setGuestEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, guestEmail: null }));
              }}
              placeholder="e.g. priya.sharma@example.com"
              maxLength={150}
              required
              className="w-full py-2.5 px-3 text-sm text-text-primary bg-transparent focus:outline-none"
              aria-invalid={Boolean(fieldErrors.guestEmail)}
              aria-describedby={fieldErrors.guestEmail ? 'guest-email-error' : undefined}
            />
          </div>
          {fieldErrors.guestEmail && (
            <p id="guest-email-error" className="text-xs text-rose-600 ml-1 mt-1 font-medium">
              {fieldErrors.guestEmail}
            </p>
          )}
          <span className="text-[11px] text-text-tertiary block ml-1">
            Used to retrieve or cancel your booking. We never share your email.
          </span>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-apple text-sm shadow-soft transition-all interactive-tap flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Holding Room...</span>
              </>
            ) : (
              <>
                <span>Secure 10-Minute Hold</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
