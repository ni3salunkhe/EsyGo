package com.hotelbooking.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.Instant;
import java.util.List;

/**
 * Standard error response DTO strictly adhering to docs/02-api-contract.md Section 7.
 * fieldErrors is always present (empty array when not applicable).
 */
public record ErrorResponse(
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
        Instant timestamp,
        int status,
        String code,
        String message,
        List<FieldErrorItem> fieldErrors
) {
    public ErrorResponse(Instant timestamp, int status, String code, String message, List<FieldErrorItem> fieldErrors) {
        this.timestamp = timestamp != null ? timestamp : Instant.now();
        this.status = status;
        this.code = code;
        this.message = message;
        this.fieldErrors = fieldErrors != null ? List.copyOf(fieldErrors) : List.of();
    }
}
