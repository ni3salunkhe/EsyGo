import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Info,
  ArrowLeft,
} from 'lucide-react';
import { confirmBooking } from '../../api/bookings.js';
import { CountdownTimer } from './CountdownTimer.jsx';
import { HotelMedia } from '../common/HotelMedia.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export function DemoPaymentModal({
  booking,
  onPaymentSuccess,
  onBackToHold,
}) {
  const [processing, setProcessing] = useState(false);
  const [simulationState, setSimulationState] = useState('idle'); // 'idle' | 'failed'
  const [errorMessage, setErrorMessage] = useState(null);
  const [isHoldExpired, setIsHoldExpired] = useState(() => {
    return booking?.expiresAt ? new Date(booking.expiresAt).getTime() <= Date.now() : false;
  });

  const { showToast } = useToast();

  if (!booking) return null;

  const {
    reference,
    hotelName,
    guestName,
    guestEmail,
    totalAmount,
    expiresAt,
  } = booking;

  // Simulate payment SUCCESS -> calls backend POST /api/bookings/{reference}/confirm
  const handleSimulateSuccess = async () => {
    if (processing || isHoldExpired) return;

    setProcessing(true);
    setErrorMessage(null);
    setSimulationState('idle');

    try {
      const confirmedBooking = await confirmBooking(reference, { email: guestEmail });
      showToast('Booking Successfully Confirmed!', 'success');
      onPaymentSuccess(confirmedBooking);
    } catch (err) {
      setErrorMessage(err.message || 'Confirmation failed.');
      if (err.code === 'HOLD_EXPIRED' || err.status === 409) {
        setIsHoldExpired(true);
        showToast('Hold expired before payment could be completed.', 'error');
      } else {
        showToast(err.message || 'Backend confirmation failed', 'error');
      }
    } finally {
      setProcessing(false);
    }
  };

  // Simulate payment FAILURE -> strictly does NOT call confirm endpoint
  const handleSimulateFailure = () => {
    setSimulationState('failed');
    setErrorMessage('Simulated payment declined by user. Your room remains held until the countdown expires.');
    showToast('Simulated payment failure (no confirm API called)', 'error');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-apple-xl border border-black/[0.08] shadow-glass space-y-8 animate-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary block">
            Step 2 of 2
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            Demo Payment Simulation
          </h2>
        </div>
        <button
          type="button"
          onClick={onBackToHold}
          disabled={processing}
          className="p-2 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-apple hover:bg-gray-100 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Hold</span>
        </button>
      </div>

      {/* Prominent Mandatory Non-Real Payment Disclosure Banner */}
      <div className="p-4 sm:p-5 rounded-apple bg-amber-50 border border-amber-200 text-amber-900 space-y-2" role="region" aria-label="Demo notice">
        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
          <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>Demo Simulation Notice — No Real Payment Gateway</span>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          This application simulates the checkout flow. <strong>No real payment gateway is integrated</strong>, and no credit card numbers or money are collected. Selecting "Simulate Payment Success" will verify and confirm your hold directly against the MySQL backend.
        </p>
      </div>

      {/* Active Hold Countdown & Transaction Summary */}
      <div className="bg-surface-bg p-5 rounded-apple border border-black/[0.04] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary block">
              Active Reservation Hold
            </span>
            <span className="text-base font-extrabold text-text-primary font-mono">
              {reference}
            </span>
          </div>
          <CountdownTimer
            expiresAt={expiresAt}
            onExpire={() => setIsHoldExpired(true)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-apple overflow-hidden flex-shrink-0 bg-gray-100">
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
              <span className="text-text-tertiary block">Property</span>
              <span className="font-semibold text-text-primary block truncate">{hotelName}</span>
            </div>
          </div>
          <div>
            <span className="text-text-tertiary block">Guest Billing Email</span>
            <span className="font-semibold text-text-primary block truncate">{guestEmail}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
          <span className="text-xs font-semibold text-text-secondary">Amount to Confirm</span>
          <span className="text-xl font-extrabold text-brand-600">
            ₹{Number(totalAmount).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Error or Simulated Failure Message */}
      {errorMessage && (
        <div
          className="p-4 rounded-apple bg-rose-50 border border-rose-200 flex items-start gap-3"
          role="alert"
        >
          <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800 space-y-1">
            <span className="font-bold block">
              {simulationState === 'failed' ? 'Simulated Payment Declined' : 'Confirmation Error'}
            </span>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Simulation Choices */}
      <div className="space-y-3 pt-2">
        <span className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          Select Simulation Outcome
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Simulate Success Button */}
          <button
            type="button"
            onClick={handleSimulateSuccess}
            disabled={processing || isHoldExpired}
            className="p-4 rounded-apple-lg border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-left flex flex-col justify-between space-y-2 group interactive-tap focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Action: Confirm Booking
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-sm font-bold text-emerald-950 block">
                Simulate Successful Payment
              </span>
              <span className="text-[11px] text-emerald-800 leading-tight block mt-0.5">
                Calls POST /api/bookings/{reference}/confirm and finalizes room as BOOKED.
              </span>
            </div>
          </button>

          {/* Simulate Failure Button */}
          <button
            type="button"
            onClick={handleSimulateFailure}
            disabled={processing || isHoldExpired}
            className="p-4 rounded-apple-lg border-2 border-rose-300 bg-rose-50 hover:bg-rose-100/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-left flex flex-col justify-between space-y-2 group interactive-tap focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Action: Reject Payment
              </span>
              <XCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <span className="text-sm font-bold text-rose-950 block">
                Simulate Failed Payment
              </span>
              <span className="text-[11px] text-rose-800 leading-tight block mt-0.5">
                Leaves room held without confirming. Proves failure does not trigger confirm API.
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* In-Flight Processing Spinner */}
      {processing && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-apple bg-brand-50 text-brand-700 text-xs font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
          <span>Arbitrating guarded confirmation against MySQL database...</span>
        </div>
      )}
    </div>
  );
}
