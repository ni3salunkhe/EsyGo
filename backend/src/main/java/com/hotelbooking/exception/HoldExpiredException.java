package com.hotelbooking.exception;

/**
 * Thrown when attempting to confirm a booking whose 10-minute hold has expired.
 * Maps to HTTP 409 HOLD_EXPIRED per docs/02-api-contract.md.
 */
public class HoldExpiredException extends RuntimeException {

    public HoldExpiredException() {
        super("Hold period has expired for this booking.");
    }

    public HoldExpiredException(String message) {
        super(message);
    }
}
