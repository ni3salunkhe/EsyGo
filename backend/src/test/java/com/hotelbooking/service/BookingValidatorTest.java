package com.hotelbooking.service;

import com.hotelbooking.dto.FieldErrorItem;
import com.hotelbooking.exception.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingValidatorTest {

    private BookingValidator validator;
    private final ZoneId zoneId = ZoneId.of("Asia/Kolkata");
    // Fix clock at 2026-12-01 10:00:00 UTC (today = 2026-12-01 in Asia/Kolkata)
    private final Instant fixedInstant = Instant.parse("2026-12-01T10:00:00Z");

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(fixedInstant, zoneId);
        validator = new BookingValidator(fixedClock, 30, 365);
    }

    @Test
    @DisplayName("VAL-01: check-in in the past rejected with specific field and message")
    void checkInInPast_rejected() {
        LocalDate yesterday = LocalDate.of(2026, 11, 30);
        LocalDate checkOut = LocalDate.of(2026, 12, 3);

        assertThatThrownBy(() -> validator.validateStayRange(yesterday, checkOut))
                .isInstanceOf(ValidationException.class)
                .satisfies(ex -> {
                    ValidationException ve = (ValidationException) ex;
                    assertThat(ve.getFieldErrors())
                            .anyMatch(fe -> "checkIn".equals(fe.field()) && fe.message().contains("cannot be in the past"));
                });
    }

    @Test
    @DisplayName("VAL-02: check-in today accepted")
    void checkInToday_accepted() {
        LocalDate today = LocalDate.of(2026, 12, 1);
        LocalDate checkOut = LocalDate.of(2026, 12, 3);

        // Should not throw
        validator.validateStayRange(today, checkOut);
    }

    @Test
    @DisplayName("VAL-03: check-out == check-in rejected with message 'must be after checkIn'")
    void checkOutEqualsCheckIn_rejected() {
        LocalDate sameDate = LocalDate.of(2026, 12, 5);

        assertThatThrownBy(() -> validator.validateStayRange(sameDate, sameDate))
                .isInstanceOf(ValidationException.class)
                .satisfies(ex -> {
                    ValidationException ve = (ValidationException) ex;
                    assertThat(ve.getFieldErrors())
                            .anyMatch(fe -> "checkOut".equals(fe.field()) && fe.message().contains("must be after checkIn"));
                });
    }

    @Test
    @DisplayName("VAL-04: check-out < check-in rejected with message 'must be after checkIn'")
    void checkOutBeforeCheckIn_rejected() {
        LocalDate checkIn = LocalDate.of(2026, 12, 5);
        LocalDate checkOut = LocalDate.of(2026, 12, 4);

        assertThatThrownBy(() -> validator.validateStayRange(checkIn, checkOut))
                .isInstanceOf(ValidationException.class)
                .satisfies(ex -> {
                    ValidationException ve = (ValidationException) ex;
                    assertThat(ve.getFieldErrors())
                            .anyMatch(fe -> "checkOut".equals(fe.field()) && fe.message().contains("must be after checkIn"));
                });
    }

    @Test
    @DisplayName("VAL-05: nights > max-nights (30) rejected with message 'must not exceed 30 nights'")
    void nightsExceedingMax_rejected() {
        LocalDate checkIn = LocalDate.of(2026, 12, 1);
        LocalDate checkOut = LocalDate.of(2027, 1, 2); // 32 nights

        assertThatThrownBy(() -> validator.validateStayRange(checkIn, checkOut))
                .isInstanceOf(ValidationException.class)
                .satisfies(ex -> {
                    ValidationException ve = (ValidationException) ex;
                    assertThat(ve.getFieldErrors())
                            .anyMatch(fe -> "checkOut".equals(fe.field()) && fe.message().contains("must not exceed 30 nights"));
                });
    }

    @Test
    @DisplayName("VAL-06: check-out beyond 365 days window rejected")
    void checkOutBeyondWindow_rejected() {
        LocalDate checkIn = LocalDate.of(2026, 12, 1).plusDays(360);
        LocalDate checkOut = LocalDate.of(2026, 12, 1).plusDays(366); // beyond 365 days from today

        assertThatThrownBy(() -> validator.validateStayRange(checkIn, checkOut))
                .isInstanceOf(ValidationException.class)
                .satisfies(ex -> {
                    ValidationException ve = (ValidationException) ex;
                    assertThat(ve.getFieldErrors())
                            .anyMatch(fe -> "checkOut".equals(fe.field()) && fe.message().contains("cannot extend beyond 365 days window"));
                });
    }

    @Test
    @DisplayName("VAL-07: blank, whitespace-only, or oversized name rejected")
    void invalidGuestName_rejected() {
        LocalDate in = LocalDate.of(2026, 12, 5);
        LocalDate out = LocalDate.of(2026, 12, 7);

        // Blank name
        assertThatThrownBy(() -> validator.validateReserveRequest(1L, in, out, "   ", "guest@test.io"))
                .isInstanceOf(ValidationException.class)
                .satisfies(ex -> {
                    ValidationException ve = (ValidationException) ex;
                    assertThat(ve.getFieldErrors())
                            .anyMatch(fe -> "guestName".equals(fe.field()) && fe.message().contains("between 1 and 100"));
                });

        // Oversized name (> 100 chars)
        String longName = "A".repeat(101);
        assertThatThrownBy(() -> validator.validateReserveRequest(1L, in, out, longName, "guest@test.io"))
                .isInstanceOf(ValidationException.class)
                .satisfies(ex -> {
                    ValidationException ve = (ValidationException) ex;
                    assertThat(ve.getFieldErrors())
                            .anyMatch(fe -> "guestName".equals(fe.field()) && fe.message().contains("between 1 and 100"));
                });
    }

    @Test
    @DisplayName("VAL-08: malformed email rejected")
    void malformedEmail_rejected() {
        LocalDate in = LocalDate.of(2026, 12, 5);
        LocalDate out = LocalDate.of(2026, 12, 7);

        String[] badEmails = {"plainaddress", "missing@domain", "@nodomain.com", "spaces in@mail.com", "a@b"};
        for (String badEmail : badEmails) {
            assertThatThrownBy(() -> validator.validateReserveRequest(1L, in, out, "Valid Name", badEmail))
                    .isInstanceOf(ValidationException.class)
                    .satisfies(ex -> {
                        ValidationException ve = (ValidationException) ex;
                        assertThat(ve.getFieldErrors())
                                .anyMatch(fe -> "guestEmail".equals(fe.field()) && fe.message().contains("well-formed email"));
                    });
        }
    }

    @Test
    @DisplayName("VAL-09: search with exactly one date provided rejected with 'both checkIn and checkOut must be provided'")
    void searchWithOneDateOnly_rejected() {
        LocalDate date = LocalDate.of(2026, 12, 5);

        // checkIn only
        assertThatThrownBy(() -> validator.validateSearchDates(date, null))
                .isInstanceOf(ValidationException.class)
                .satisfies(ex -> {
                    ValidationException ve = (ValidationException) ex;
                    assertThat(ve.getFieldErrors())
                            .anyMatch(fe -> fe.message().contains("both checkIn and checkOut must be provided"));
                });

        // checkOut only
        assertThatThrownBy(() -> validator.validateSearchDates(null, date))
                .isInstanceOf(ValidationException.class)
                .satisfies(ex -> {
                    ValidationException ve = (ValidationException) ex;
                    assertThat(ve.getFieldErrors())
                            .anyMatch(fe -> fe.message().contains("both checkIn and checkOut must be provided"));
                });

        // neither (browse mode) -> valid
        validator.validateSearchDates(null, null);
    }

    @Test
    @DisplayName("VAL-NORM: normalizeEmail trims and lowercases")
    void normalizeEmail_trimsAndLowercases() {
        assertThat(validator.normalizeEmail("  Guest.User@Domain.COM  ")).isEqualTo("guest.user@domain.com");
        assertThat(validator.normalizeEmail(null)).isNull();
    }
}
