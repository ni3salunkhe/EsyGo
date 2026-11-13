package com.hotelbooking.service;

import com.hotelbooking.dto.FieldErrorItem;
import com.hotelbooking.exception.ValidationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Validates request parameters and payloads against domain rules in docs/02-api-contract.md.
 */
@Service
public class BookingValidator {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    private final Clock clock;
    private final int maxNights;
    private final int windowDays;

    public BookingValidator(Clock clock,
                            @Value("${app.booking.max-nights:30}") int maxNights,
                            @Value("${app.inventory.window-days:365}") int windowDays) {
        this.clock = clock;
        this.maxNights = maxNights;
        this.windowDays = windowDays;
    }

    /**
     * Validates search query dates (both must be present, or both absent).
     */
    public void validateSearchDates(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null && checkOut == null) {
            // Browse mode: valid
            return;
        }

        if (checkIn == null || checkOut == null) {
            List<FieldErrorItem> errors = new ArrayList<>();
            if (checkIn == null) {
                errors.add(new FieldErrorItem("checkIn", "both checkIn and checkOut must be provided"));
            }
            if (checkOut == null) {
                errors.add(new FieldErrorItem("checkOut", "both checkIn and checkOut must be provided"));
            }
            throw new ValidationException("Invalid search dates", errors);
        }

        validateStayRange(checkIn, checkOut);
    }

    /**
     * Validates reserve booking request parameters.
     */
    public void validateReserveRequest(Long hotelId, LocalDate checkIn, LocalDate checkOut,
                                       String guestName, String guestEmail) {
        List<FieldErrorItem> errors = new ArrayList<>();

        if (hotelId == null || hotelId <= 0) {
            errors.add(new FieldErrorItem("hotelId", "must be a valid hotel id"));
        }

        if (guestName == null || guestName.trim().isEmpty() || guestName.trim().length() > 100) {
            errors.add(new FieldErrorItem("guestName", "must be between 1 and 100 characters"));
        }

        if (guestEmail == null || guestEmail.trim().isEmpty() || guestEmail.trim().length() > 150
                || !EMAIL_PATTERN.matcher(guestEmail.trim()).matches()) {
            errors.add(new FieldErrorItem("guestEmail", "must be a well-formed email address"));
        }

        // Date range checks
        collectStayRangeErrors(checkIn, checkOut, errors);

        if (!errors.isEmpty()) {
            throw new ValidationException("Reserve request validation failed", errors);
        }
    }

    /**
     * Validates that dates form a legal half-open stay range [checkIn, checkOut).
     */
    public void validateStayRange(LocalDate checkIn, LocalDate checkOut) {
        List<FieldErrorItem> errors = new ArrayList<>();
        collectStayRangeErrors(checkIn, checkOut, errors);
        if (!errors.isEmpty()) {
            throw new ValidationException("Invalid stay range", errors);
        }
    }

    private void collectStayRangeErrors(LocalDate checkIn, LocalDate checkOut, List<FieldErrorItem> errors) {
        LocalDate today = LocalDate.now(clock);

        if (checkIn == null) {
            errors.add(new FieldErrorItem("checkIn", "checkIn date is required"));
            return;
        }
        if (checkOut == null) {
            errors.add(new FieldErrorItem("checkOut", "checkOut date is required"));
            return;
        }

        if (checkIn.isBefore(today)) {
            errors.add(new FieldErrorItem("checkIn", "cannot be in the past"));
        }

        if (!checkOut.isAfter(checkIn)) {
            errors.add(new FieldErrorItem("checkOut", "must be after checkIn"));
            return; // Cannot evaluate nights if checkOut <= checkIn
        }

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights > maxNights) {
            errors.add(new FieldErrorItem("checkOut", String.format("must not exceed %d nights", maxNights)));
        }

        LocalDate maxDate = today.plusDays(windowDays);
        if (checkOut.isAfter(maxDate)) {
            errors.add(new FieldErrorItem("checkOut", String.format("stay cannot extend beyond %d days window", windowDays)));
        }
    }

    /**
     * Normalizes guest email: trimmed and converted to lowercase.
     */
    public String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase();
    }
}
