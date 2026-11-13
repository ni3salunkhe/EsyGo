package com.hotelbooking.exception;

import com.hotelbooking.dto.FieldErrorItem;

import java.util.Collections;
import java.util.List;

/**
 * Thrown when request payload or query parameters fail domain validation rules.
 */
public class ValidationException extends RuntimeException {

    private final List<FieldErrorItem> fieldErrors;

    public ValidationException(String message, List<FieldErrorItem> fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors != null ? List.copyOf(fieldErrors) : Collections.emptyList();
    }

    public ValidationException(String field, String message) {
        this(message, List.of(new FieldErrorItem(field, message)));
    }

    public List<FieldErrorItem> getFieldErrors() {
        return fieldErrors;
    }
}
