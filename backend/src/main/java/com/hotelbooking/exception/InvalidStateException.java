package com.hotelbooking.exception;

/**
 * Thrown when a state transition is not permitted from the booking's current status.
 * Maps to HTTP 409 INVALID_STATE per docs/02-api-contract.md.
 */
public class InvalidStateException extends RuntimeException {

    public InvalidStateException(String message) {
        super(message);
    }
}
