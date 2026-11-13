package com.hotelbooking.dto;

/**
 * Represents a field-level error in API validation responses.
 */
public record FieldErrorItem(String field, String message) {
}
