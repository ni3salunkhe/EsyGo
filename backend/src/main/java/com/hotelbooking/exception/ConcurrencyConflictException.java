package com.hotelbooking.exception;

/**
 * Thrown when an operation encounters repeated concurrency conflicts (e.g. repeated deadlocks).
 * Maps to HTTP 409 CONCURRENCY_CONFLICT.
 */
public class ConcurrencyConflictException extends RuntimeException {

    public ConcurrencyConflictException(String message) {
        super(message);
    }

    public ConcurrencyConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}
