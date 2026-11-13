package com.hotelbooking.controller;

import com.hotelbooking.dto.ErrorResponse;
import com.hotelbooking.dto.FieldErrorItem;
import com.hotelbooking.exception.ConcurrencyConflictException;
import com.hotelbooking.exception.ResourceNotFoundException;
import com.hotelbooking.exception.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Central exception handler guaranteeing exact adherence to docs/02-api-contract.md Section 7.
 * Never exposes stack traces, SQL, or internal class names in error responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final Clock clock;

    public GlobalExceptionHandler(Clock clock) {
        this.clock = clock;
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(ValidationException ex) {
        ErrorResponse error = new ErrorResponse(
                Instant.now(clock),
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                ex.getMessage(),
                ex.getFieldErrors()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
                Instant.now(clock),
                HttpStatus.NOT_FOUND.value(),
                "NOT_FOUND",
                ex.getMessage(),
                List.of()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFoundException(NoResourceFoundException ex) {
        ErrorResponse error = new ErrorResponse(
                Instant.now(clock),
                HttpStatus.NOT_FOUND.value(),
                "NOT_FOUND",
                "Resource not found: " + ex.getResourcePath(),
                List.of()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String paramName = ex.getName();
        String message = "Invalid value for parameter '" + paramName + "'";
        List<FieldErrorItem> fieldErrors = List.of(new FieldErrorItem(paramName, message));
        ErrorResponse error = new ErrorResponse(
                Instant.now(clock),
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                message,
                fieldErrors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException ex) {
        String message = "Required parameter '" + ex.getParameterName() + "' is missing";
        List<FieldErrorItem> fieldErrors = List.of(new FieldErrorItem(ex.getParameterName(), message));
        ErrorResponse error = new ErrorResponse(
                Instant.now(clock),
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                message,
                fieldErrors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleMalformedJson(HttpMessageNotReadableException ex) {
        ErrorResponse error = new ErrorResponse(
                Instant.now(clock),
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                "Malformed request body",
                List.of()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        List<FieldErrorItem> fieldErrors = new ArrayList<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.add(new FieldErrorItem(fe.getField(), fe.getDefaultMessage()));
        }
        ErrorResponse error = new ErrorResponse(
                Instant.now(clock),
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                "Validation failed for one or more fields",
                fieldErrors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(ConcurrencyConflictException.class)
    public ResponseEntity<ErrorResponse> handleConcurrencyConflict(ConcurrencyConflictException ex) {
        ErrorResponse error = new ErrorResponse(
                Instant.now(clock),
                HttpStatus.CONFLICT.value(),
                "CONCURRENCY_CONFLICT",
                ex.getMessage(),
                List.of()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(com.hotelbooking.exception.SoldOutException.class)
    public ResponseEntity<ErrorResponse> handleSoldOutException(com.hotelbooking.exception.SoldOutException ex) {
        ErrorResponse error = new ErrorResponse(
                Instant.now(clock),
                HttpStatus.CONFLICT.value(),
                "SOLD_OUT",
                ex.getMessage(),
                List.of()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Unhandled exception caught by GlobalExceptionHandler", ex);
        ErrorResponse error = new ErrorResponse(
                Instant.now(clock),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "INTERNAL_ERROR",
                "An unexpected internal error occurred.",
                List.of()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
