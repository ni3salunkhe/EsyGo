package com.hotelbooking.dto;

import java.time.LocalDate;

/**
 * Request payload for POST /api/bookings per docs/02-api-contract.md Section 3.
 */
public record ReserveBookingRequest(
        Long hotelId,
        LocalDate checkIn,
        LocalDate checkOut,
        String guestName,
        String guestEmail
) {
}
