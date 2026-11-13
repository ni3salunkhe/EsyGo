import React, { useState, useEffect } from 'react';
import {
  Search,
  Mail,
  Hash,
  CalendarCheck,
  ShieldAlert,
  Loader2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { getBooking, cancelBooking } from '../api/bookings.js';
import { getHotelDetail } from '../api/hotels.js';
import { HotelMedia } from '../components/common/HotelMedia.jsx';
import { Dialog } from '../components/common/Dialog.jsx';
import { getTodayString, formatDisplayDate } from '../utils/dateUtils.js';
import { useToast } from '../context/ToastContext.jsx';

export function ManageBookingPage({ initialReference = '', initialEmail = '', onExplore }) {
  const [reference, setReference] = useState(initialReference);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [hotelDetails, setHotelDetails] = useState(null);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Cancellation state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const { showToast } = useToast();
  const today = getTodayString();

  // If initial reference and email provided (e.g. from confirmation ticket), auto-lookup
  useEffect(() => {
    if (initialReference && initialEmail) {
      setReference(initialReference);
      setEmail(initialEmail);
      handleLookup(initialReference, initialEmail);
    }
  }, [initialReference, initialEmail]);

  const validateLookupForm = () => {
    const errors = {};
    const trimmedRef = reference.trim();
    const trimmedEmail = email.trim();

    if (!trimmedRef) {
      errors.reference = 'Booking reference is required.';
    }
    if (!trimmedEmail) {
      errors.email = 'Registered email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please provide a valid email address.';
    }

    return errors;
  };

  const handleLookup = async (refToUse = reference, emailToUse = email) => {
    const trimmedRef = (refToUse || '').trim().toUpperCase();
    const trimmedEmail = (emailToUse || '').trim();

    if (!trimmedRef || !trimmedEmail) {
      setFieldErrors(validateLookupForm());
      return;
    }

    setFieldErrors({});
    setError(null);
    setLoading(true);

    try {
      const data = await getBooking(trimmedRef, trimmedEmail);
      setBooking(data);
      showToast('Booking details retrieved successfully', 'success');

      // Requirement 7: On booking retrieval, use the booking's hotelId to retrieve hotel details and its gallery
      if (data && data.hotelId) {
        try {
          const hotelData = await getHotelDetail(data.hotelId);
          setHotelDetails(hotelData);
        } catch (hotelErr) {
          // Graceful fallback if hotel details fail to load
          setHotelDetails(null);
        }
      }
    } catch (err) {
      setBooking(null);
      setHotelDetails(null);
      if (err.status === 404 || err.code === 'NOT_FOUND') {
        setError('Booking not found. Please verify that both the booking reference and registered email match your reservation.');
      } else {
        setError(err.message || 'Unable to retrieve booking.');
      }
      showToast(err.message || 'Booking retrieval failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLookup(reference, email);
  };

  const handleConfirmCancel = async () => {
    if (!booking || cancelling) return;

    setCancelling(true);
    setCancelError(null);

    try {
      const updated = await cancelBooking(booking.reference, { email: booking.guestEmail });
      setBooking(updated);
      setCancelDialogOpen(false);
      showToast('Booking successfully cancelled. Room nights have been released.', 'success');
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel booking.');
      showToast(err.message || 'Cancellation failed', 'error');
    } finally {
      setCancelling(false);
    }
  };

  // Eligibility: confirmed or held, and checkIn > today
  const isFutureStay = booking ? booking.checkIn > today : false;
  const isConfirmedOrHeld = booking ? (booking.status === 'CONFIRMED' || booking.status === 'HELD') : false;
  const canCancel = isConfirmedOrHeld && isFutureStay;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
          Manage Your Booking
        </h1>
        <p className="text-sm text-text-secondary max-w-lg mx-auto">
          Look up your reservation details, check status, or request a cancellation using your booking reference and registered email.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="bg-white p-6 sm:p-8 rounded-apple-xl border border-black/[0.08] shadow-soft-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reference */}
            <div className="space-y-1">
              <label htmlFor="manage-ref" className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Booking Reference <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center bg-surface-bg rounded-apple border border-black/[0.08] focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                <Hash className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" aria-hidden="true" />
                <input
                  id="manage-ref"
                  type="text"
                  value={reference}
                  onChange={(e) => {
                    setReference(e.target.value.toUpperCase());
                    setFieldErrors((prev) => ({ ...prev, reference: null }));
                  }}
                  placeholder="e.g. HB-123456"
                  maxLength={20}
                  className="w-full py-2.5 px-3 text-sm text-text-primary uppercase font-mono tracking-wider bg-transparent focus:outline-none"
                  aria-invalid={Boolean(fieldErrors.reference)}
                />
              </div>
              {fieldErrors.reference && (
                <p className="text-xs text-rose-600 ml-1 font-medium">{fieldErrors.reference}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="manage-email" className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Registered Guest Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center bg-surface-bg rounded-apple border border-black/[0.08] focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                <Mail className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" aria-hidden="true" />
                <input
                  id="manage-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="e.g. priya.sharma@example.com"
                  className="w-full py-2.5 px-3 text-sm text-text-primary bg-transparent focus:outline-none"
                  aria-invalid={Boolean(fieldErrors.email)}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-rose-600 ml-1 font-medium">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-apple text-xs sm:text-sm shadow-soft transition-all interactive-tap flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Retrieving...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Retrieve Booking</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-apple bg-rose-50 border border-rose-200 flex items-start gap-3" role="alert">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 space-y-1">
              <span className="font-bold block">Lookup Failed</span>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Retrieved Booking Card */}
      {booking && (
        <div className="bg-white rounded-apple-xl border border-black/[0.08] shadow-glass overflow-hidden space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header Banner with Reference & Status */}
          <div className="bg-surface-bg p-6 border-b border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary block">
                Reservation Status
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-extrabold font-mono text-text-primary tracking-wider">
                  {booking.reference}
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                    booking.status === 'CONFIRMED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : booking.status === 'HELD'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : booking.status === 'CANCELLED'
                      ? 'bg-gray-100 text-gray-700 border-gray-300'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {booking.status}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="self-start sm:self-center px-3 py-1.5 rounded-apple bg-white border border-black/[0.08] text-xs font-semibold text-text-primary hover:bg-gray-50 flex items-center gap-1.5 transition-colors print:hidden"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Details</span>
            </button>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Property Line with Hotel Media & Gallery Continuity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-black/[0.06] text-xs">
              <div className="flex items-start gap-3.5">
                <div className="w-16 h-16 rounded-apple overflow-hidden flex-shrink-0 bg-gray-100">
                  <HotelMedia
                    imageUrl={hotelDetails?.images?.[0] || hotelDetails?.imageUrl}
                    images={hotelDetails?.images || []}
                    hotelName={booking.hotelName}
                    aspectRatio="w-full h-full"
                    className="w-full h-full !rounded-none"
                    showBadge={false}
                    showName={false}
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-text-tertiary block">Property</span>
                  <span className="text-base font-bold text-text-primary block mt-0.5 truncate">{booking.hotelName}</span>
                  {hotelDetails?.location && (
                    <span className="text-text-tertiary block text-[11px] truncate">{hotelDetails.location}</span>
                  )}
                  <span className="text-text-tertiary block mt-0.5">Assigned Room: <strong className="text-text-primary">{booking.roomNumber}</strong></span>
                </div>
              </div>
              <div>
                <span className="text-text-tertiary block">Guest</span>
                <span className="text-sm font-semibold text-text-primary block mt-0.5">{booking.guestName}</span>
                <span className="text-text-tertiary block mt-0.5">{booking.guestEmail}</span>
              </div>
            </div>

            {/* If hotel has multiple gallery images, render a compact gallery preview */}
            {hotelDetails?.images && hotelDetails.images.length > 1 && (
              <div className="p-3 bg-surface-bg rounded-apple border border-black/[0.04] space-y-2">
                <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block">
                  Property Photo Gallery ({hotelDetails.images.length} photos)
                </span>
                <div
                  className="flex gap-2 overflow-x-auto pb-1"
                  role="region"
                  aria-label="Retrieved booking hotel gallery"
                >
                  {hotelDetails.images.map((imgUrl, idx) => (
                    <div key={idx} className="w-16 h-12 rounded overflow-hidden flex-shrink-0 border border-black/[0.06]">
                      <img
                        src={imgUrl}
                        alt={`${booking.hotelName} photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dates & Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-black/[0.06] text-xs">
              <div>
                <span className="text-text-tertiary block">Stay Duration</span>
                <span className="font-semibold text-text-primary block mt-0.5">
                  {booking.nights} night{booking.nights > 1 ? 's' : ''} ({formatDisplayDate(booking.checkIn)} &ndash; {formatDisplayDate(booking.checkOut)})
                </span>
              </div>
              <div>
                <span className="text-text-tertiary block">Rate &amp; Total</span>
                <span className="text-text-secondary block mt-0.5">₹{Number(booking.pricePerNight).toLocaleString('en-IN')} / night</span>
                <span className="text-base font-extrabold text-brand-600 block mt-0.5">
                  Total: ₹{Number(booking.totalAmount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Status Information / Eligibility Messaging */}
            {booking.status === 'CANCELLED' && (
              <div className="p-4 rounded-apple bg-gray-50 border border-gray-200 text-xs text-gray-700 flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">This reservation has been cancelled</span>
                  <p className="mt-0.5">Room nights have been released back into available inventory for other guests.</p>
                </div>
              </div>
            )}

            {booking.status === 'CONFIRMED' && !isFutureStay && (
              <div className="p-4 rounded-apple bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Cancellation Period Lapsed</span>
                  <p className="mt-0.5">Per system policy (CAN-04), bookings cannot be cancelled once the check-in date has arrived or passed.</p>
                </div>
              </div>
            )}

            {/* Cancellation Action Area */}
            {canCancel && (
              <div className="p-5 rounded-apple bg-rose-50/60 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-rose-900 block">Need to cancel your stay?</span>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Cancellation is available until departure day. Room nights will be released back to the catalog.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCancelDialogOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-apple text-xs font-bold transition-colors interactive-tap shadow-soft-sm flex-shrink-0"
                >
                  Cancel Booking
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accessible Cancellation Dialog */}
      <Dialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="Confirm Booking Cancellation"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            Are you sure you want to cancel booking <strong className="text-text-primary font-mono">{booking?.reference}</strong> at {booking?.hotelName}?
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-apple text-xs text-amber-900 leading-relaxed">
            <strong>Important Policy:</strong> This is a demo simulation. No refund is collected or processed. All claimed room nights will immediately transition back to <span className="font-bold">AVAILABLE</span> in MySQL inventory.
          </div>

          {cancelError && (
            <p className="text-xs text-rose-600 font-semibold">{cancelError}</p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-black/[0.06]">
            <button
              type="button"
              disabled={cancelling}
              onClick={() => setCancelDialogOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-apple hover:bg-gray-100 transition-colors"
            >
              Keep My Booking
            </button>
            <button
              type="button"
              disabled={cancelling}
              onClick={handleConfirmCancel}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-apple text-xs shadow-soft-sm transition-colors flex items-center gap-1.5"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <span>Yes, Cancel Booking</span>
              )}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
