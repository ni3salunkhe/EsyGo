import React from 'react';

/**
 * YouTube-inspired subtle shimmer skeleton placeholder.
 */
export function Skeleton({ className = '', variant = 'rect', ...props }) {
  const baseClasses = 'animate-pulse bg-gray-200/80 rounded';
  
  let variantClasses = '';
  if (variant === 'circle') {
    variantClasses = 'rounded-full';
  } else if (variant === 'card') {
    variantClasses = 'rounded-apple-lg';
  } else if (variant === 'text') {
    variantClasses = 'h-4 rounded';
  } else if (variant === 'pill') {
    variantClasses = 'rounded-full h-6';
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Pre-composed skeleton for a compact horizontal hotel discovery card.
 */
export function HotelCardSkeleton() {
  return (
    <div className="bg-white rounded-apple-lg border border-black/[0.06] overflow-hidden shadow-soft-sm flex flex-col md:flex-row">
      <Skeleton className="w-full md:w-60 lg:w-64 flex-shrink-0 aspect-[16/10] md:aspect-auto h-40 sm:h-44 md:h-auto" />
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 min-w-0">
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-4">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-8 w-full" />
          <div className="flex gap-1.5 pt-1">
            <Skeleton className="h-5 w-14" variant="pill" />
            <Skeleton className="h-5 w-16" variant="pill" />
            <Skeleton className="h-5 w-14" variant="pill" />
          </div>
        </div>
        <div className="pt-2.5 border-t border-black/[0.04] flex justify-between items-end">
          <div className="space-y-1">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-8 w-28 rounded-apple" />
        </div>
      </div>
    </div>
  );
}

/**
 * Pre-composed skeleton for the hotel detail page.
 */
export function HotelDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      <div className="space-y-3">
        <Skeleton className="h-10 w-2/5" />
        <Skeleton className="h-5 w-1/4" />
      </div>
      <Skeleton className="w-full aspect-[21/9] rounded-apple-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
        </div>
        <div className="space-y-4 p-6 bg-white rounded-apple-lg border border-black/[0.06]">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full rounded-apple" />
        </div>
      </div>
    </div>
  );
}
