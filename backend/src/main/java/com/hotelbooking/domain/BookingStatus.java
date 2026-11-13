package com.hotelbooking.domain;

/**
 * Valid states for a booking:
 * HELD -> CONFIRMED -> CANCELLED
 * HELD -> CANCELLED
 * HELD -> EXPIRED
 */
public enum BookingStatus {
    HELD,
    CONFIRMED,
    CANCELLED,
    EXPIRED
}
