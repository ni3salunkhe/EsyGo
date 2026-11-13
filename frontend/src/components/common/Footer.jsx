import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-black/[0.06] mt-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-tertiary">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Real-time MySQL backend synchronization &amp; atomic hold guarantees</span>
        </div>
        <p className="text-center sm:text-right">
          Demo Booking Platform &bull; Demo Simulation &bull; No Real Payment Processed
        </p>
      </div>
    </footer>
  );
}
