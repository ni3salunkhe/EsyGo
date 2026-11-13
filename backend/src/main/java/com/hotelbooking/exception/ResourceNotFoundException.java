package com.hotelbooking.exception;

/**
 * Exception thrown when a requested resource (such as a hotel or booking) is not found.
 * Maps to HTTP 404 NOT_FOUND per docs/02-api-contract.md.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
