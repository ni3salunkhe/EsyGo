import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, X, AlertTriangle } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer.jsx';
import { HotelMedia } from '../common/HotelMedia.jsx';
import { formatDisplayDate } from '../../utils/dateUtils.js';

export function HoldReviewModal({
  booking,
  onProceedToPayment,
  onReleaseHold,
}) {
  const isPastExpiry = booking?.expiresAt ? new Date(booking.expiresAt).getTime() <= Date.now() : false;
  const [isExpired, setIsExpired] = useState(isPastExpiry);

  if (!booking) return null;

  const {
    reference,
    status,
    hotelName,
    roomNumber,
    guestName,
    guestEmail,
    checkIn,
    checkOut,
    nights,
    pricePerNight,
    totalAmount,
    expiresAt,
  } = booking;

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-apple-xl border border-black/[0.08] shadow-glass space-y-8 animate-in zoom-in-95 duration-200">
      {/* Top Banner with Reference & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary block">
            Reservation Hold Secured
          </span>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight font-mono">
              {reference}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-300">
              {status}
            </span>
          </div>
        </div>

        {/* Real-time Countdown Timer */}
        <div className="w-full sm:w-auto">
          <CountdownTimer expiresAt={expiresAt} onExpire={() => setIsExpired(true)} />
        </div>
      </div>

      {/* Expiry Alert Warning */}
      {isExpired && (
        <div className="p-4 rounded-apple bg-rose-50 border border-rose-200 flex items-start gap-3" role="alert">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800 space-y-1">
            <span className="font-bold block">Your 10-minute hold has expired</span>
            <p>
              The server background expiry job releases expired holds back to public inventory. To reserve this room, please return to search and re-select your dates.
            </p>
          </div>
        </div>
      )}

      {/* Reservation Specifications with Image Continuity */}
      <div className="bg-surface-bg p-5 rounded-apple border border-black/[0.04] space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-apple overflow-hidden flex-shrink-0 bg-gray-100">
              <HotelMedia
                imageUrl={booking.hotel?.images?.[0] || booking.hotel?.imageUrl}
                hotelName={hotelName}
                aspectRatio="w-full h-full"
                className="w-full h-full !rounded-none"
                showBadge={false}
                showName={false}
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-text-primary truncate">{hotelName}</h3>
              <p className="text-xs text-text-tertiary">Assigned Room: <span className="font-semibold text-text-primary">{roomNumber}</span></p>
            </div>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1 flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            MySQL Invariant Protected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-black/[0.06] text-xs">
          <div>
            <span className="text-text-tertiary block">Stay Duration</span>
            <span className="font-semibold text-text-primary">
              {nights} night{nights > 1 ? 's' : ''} ({formatDisplayDate(checkIn)} &ndash; {formatDisplayDate(checkOut)})
            </span>
          </div>
          <div>
            <span className="text-text-tertiary block">Guest</span>
            <span className="font-semibold text-text-primary block truncate">{guestName}</span>
            <span className="text-text-tertiary block truncate">{guestEmail}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs">
          <div>
            <span className="text-text-tertiary block">Price per night: ₹{Number(pricePerNight).toLocaleString('en-IN')}</span>
            <span className="text-base font-extrabold text-brand-600 block mt-0.5">
              Total Amount: ₹{Number(totalAmount).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[11px] text-text-tertiary text-right max-w-[180px]">
            Server calculated amount. Real MySQL transaction.
          </span>
        </div>
      </div>

      {/* Next Step Action CTA */}
      <div className="pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onReleaseHold}
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-apple hover:bg-gray-100 transition-colors"
        >
          Cancel &amp; Release Hold
        </button>

        <button
          type="button"
          disabled={isExpired}
          onClick={onProceedToPayment}
          className="w-full sm:w-auto px-6 py-3 bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-apple text-sm shadow-soft transition-all interactive-tap flex items-center justify-center gap-2"
        >
          <span>Proceed to Demo Payment</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
