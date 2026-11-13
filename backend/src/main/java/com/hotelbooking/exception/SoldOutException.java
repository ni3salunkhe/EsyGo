package com.hotelbooking.exception;

/**
 * Thrown when no rooms are available for the requested stay dates during booking reserve.
 * Maps to HTTP 409 SOLD_OUT per docs/02-api-contract.md.
 */
public class SoldOutException extends RuntimeException {

    public SoldOutException() {
        super("No rooms available for the selected dates.");
    }

    public SoldOutException(String message) {
        super(message);
    }
}
