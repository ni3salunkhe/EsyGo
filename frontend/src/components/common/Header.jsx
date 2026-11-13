import React from 'react';
import { Building, CalendarCheck, Compass } from 'lucide-react';

export function Header({ currentView, onNavigate }) {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-black/[0.06] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-apple p-1 text-left"
          aria-label="LuxeStay Home"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-apple bg-brand-500 flex items-center justify-center text-white shadow-soft transition-transform group-hover:scale-105">
            <Building className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-text-primary block leading-tight">
              LuxeStay
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-text-tertiary tracking-wide uppercase block">
              Hotel Portal
            </span>
          </div>
        </button>

        {/* Navigation Items */}
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main Navigation">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors interactive-tap ${
              currentView === 'landing'
                ? 'bg-black text-white shadow-soft-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.04]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Explore</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('manage-booking')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors interactive-tap ${
              currentView === 'manage-booking'
                ? 'bg-black text-white shadow-soft-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.04]'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Manage Booking</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
