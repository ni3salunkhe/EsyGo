package com.hotelbooking.dto;

/**
 * Payload containing email for verifying booking ownership during confirm and cancel operations.
 */
public record EmailVerificationRequest(
        String email
) {
}
