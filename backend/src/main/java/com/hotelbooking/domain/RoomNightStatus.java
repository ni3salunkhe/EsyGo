package com.hotelbooking.domain;

/**
 * Valid states for a room night:
 * AVAILABLE -> RESERVED -> BOOKED
 * RESERVED -> AVAILABLE (via cancel or expiry)
 * BOOKED -> AVAILABLE (via cancel)
 */
public enum RoomNightStatus {
    AVAILABLE,
    RESERVED,
    BOOKED
}
