import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

/**
 * Visual countdown timer based on server-provided expiresAt.
 * Server database clock is authoritative; this timer provides local visual feedback.
 */
export function CountdownTimer({ expiresAt, onExpire }) {
  const [timeLeftMs, setTimeLeftMs] = useState(() => {
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeftMs(0);
        clearInterval(interval);
        if (onExpire) {
          onExpire();
        }
      } else {
        setTimeLeftMs(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isExpiringSoon = totalSeconds > 0 && totalSeconds < 180; // under 3 minutes
  const isExpired = totalSeconds <= 0;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-apple border transition-all ${
        isExpired
          ? 'bg-rose-50 border-rose-200 text-rose-700'
          : isExpiringSoon
          ? 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
          : 'bg-brand-50 border-brand-100 text-brand-800'
      }`}
      role="timer"
      aria-live="polite"
      aria-label={isExpired ? 'Hold has expired' : `Time remaining to complete booking: ${minutes} minutes and ${seconds} seconds`}
    >
      {isExpired ? (
        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
      ) : (
        <Clock className={`w-4 h-4 flex-shrink-0 ${isExpiringSoon ? 'text-amber-600' : 'text-brand-600'}`} />
      )}

      <div className="text-xs font-semibold leading-tight">
        {isExpired ? (
          <span>Hold Expired &bull; Inventory released back to catalog</span>
        ) : (
          <span>
            Room Held: <span className="font-mono font-bold tracking-wider">{formattedTime}</span> remaining
          </span>
        )}
      </div>
    </div>
  );
}
