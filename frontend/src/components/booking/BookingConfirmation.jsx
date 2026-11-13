import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  CalendarCheck,
  Compass,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { HotelMedia } from '../common/HotelMedia.jsx';
import { formatDisplayDate } from '../../utils/dateUtils.js';

export function BookingConfirmation({
  booking,
  onNavigateToManage,
  onNavigateToExplore,
}) {
  const [copied, setCopied] = useState(false);

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
    createdAt,
  } = booking;

  const handleCopyReference = () => {
    if (navigator.clipboard && reference) {
      navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedCreated = createdAt
    ? new Date(createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
      })
    : '';

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Success Badge Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-soft">
          <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
          Booking Confirmed!
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
          Your room nights have transitioned permanently to <span className="font-semibold text-text-primary">BOOKED</span> in MySQL inventory.
        </p>
      </div>

      {/* Confirmation Ticket Card */}
      <div className="bg-white rounded-apple-xl border border-black/[0.08] shadow-glass overflow-hidden print:border-none print:shadow-none">
        {/* Top Reference Strip */}
        <div className="bg-black text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Booking Reference
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-wider">
                {reference}
              </span>
              <button
                type="button"
                onClick={handleCopyReference}
                className="p-1.5 rounded-apple bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Copy booking reference"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {status}
            </span>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Property Line with Image Continuity */}
          <div className="pb-4 border-b border-black/[0.06] flex justify-between items-start gap-4">
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary block">
                  Reserved Property
                </span>
                <h2 className="text-lg font-bold text-text-primary mt-0.5 truncate">{hotelName}</h2>
                <p className="text-xs text-text-tertiary mt-0.5">Assigned Room: <span className="font-semibold text-text-primary">{roomNumber}</span></p>
              </div>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold flex items-center gap-1 flex-shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              Guarded Confirmation
            </span>
          </div>

          {/* Stay Dates & Guest */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-black/[0.06] text-xs">
            <div>
              <span className="text-text-tertiary block">Stay Duration</span>
              <span className="font-semibold text-text-primary block mt-0.5">
                {nights} night{nights > 1 ? 's' : ''}
              </span>
              <span className="text-text-secondary block mt-0.5">
                {formatDisplayDate(checkIn)} &ndash; {formatDisplayDate(checkOut)}
              </span>
            </div>
            <div>
              <span className="text-text-tertiary block">Guest</span>
              <span className="font-semibold text-text-primary block mt-0.5 truncate">{guestName}</span>
              <span className="text-text-secondary block mt-0.5 truncate">{guestEmail}</span>
            </div>
          </div>

          {/* Rate & Payment Disclosure */}
          <div className="pb-4 border-b border-black/[0.06] flex items-center justify-between">
            <div>
              <span className="text-text-tertiary text-xs block">
                Price per night: ₹{Number(pricePerNight).toLocaleString('en-IN')}
              </span>
              <span className="text-xl font-extrabold text-brand-600 block mt-0.5">
                Total Paid: ₹{Number(totalAmount).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 block">
                Demo Simulation
              </span>
              <span className="text-[10px] text-text-tertiary block mt-1">No real charge processed</span>
            </div>
          </div>

          {/* Timestamp */}
          {formattedCreated && (
            <p className="text-[11px] text-text-tertiary">
              Confirmed on {formattedCreated} (IST). Keep your reference and email safe for retrieval.
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2.5 rounded-apple bg-gray-100 hover:bg-gray-200 text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors interactive-tap"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Receipt</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToManage}
            className="px-4 py-2.5 rounded-apple border border-black/[0.1] hover:bg-black/[0.04] text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors interactive-tap"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Manage This Booking</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToExplore}
            className="px-4 py-2.5 rounded-apple bg-black text-white hover:bg-gray-800 text-xs font-semibold flex items-center gap-1.5 transition-colors interactive-tap shadow-soft-sm"
          >
            <Compass className="w-4 h-4" />
            <span>Explore More Hotels</span>
          </button>
        </div>
      </div>
    </div>
  );
}
