package com.hotelbooking.service;

import com.hotelbooking.dto.BookingResponse;
import com.hotelbooking.dto.EmailVerificationRequest;
import com.hotelbooking.dto.ReserveBookingRequest;
import com.hotelbooking.testutil.TestDatabaseBootstrap;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class BookingExpiryJobTest {

    @Autowired
    private BookingExpiryJob bookingExpiryJob;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final LocalDate checkIn = LocalDate.now().plusDays(20);
    private final LocalDate checkOut = checkIn.plusDays(3);

    @BeforeAll
    static void initDatabase(
            @Autowired TestDatabaseBootstrap bootstrap,
            @Autowired InventoryInitializer inventoryInitializer) {
        bootstrap.resetSchema();
        bootstrap.applySeed();
        inventoryInitializer.initializeInventory();
    }

    @BeforeEach
    void resetHolds() {
        jdbcTemplate.update("UPDATE room_night SET status = 'AVAILABLE', booking_id = NULL, reserved_until = NULL");
        jdbcTemplate.update("DELETE FROM booking");
    }

    @AfterAll
    static void restoreDatabase(
            @Autowired TestDatabaseBootstrap bootstrap,
            @Autowired InventoryInitializer inventoryInitializer) {
        bootstrap.resetSchema();
        bootstrap.applySeed();
        inventoryInitializer.initializeInventory();
    }

    private BookingResponse createBooking(String name, String email) {
        ReserveBookingRequest request = new ReserveBookingRequest(
                1L,
                checkIn,
                checkOut,
                name,
                email
        );
        return bookingService.reserve(request);
    }

    @Test
    @DisplayName("EXP-01: Expiry job expires only lapsed holds where expires_at/reserved_until < NOW()")
    void testExpiresOnlyLapsedHolds() {
        BookingResponse booking = createBooking("Lapsed User", "lapsed@exp.io");

        // Move deadlines into the past
        jdbcTemplate.update(
                "UPDATE booking SET expires_at = NOW() - INTERVAL 1 MINUTE WHERE reference = ?",
                booking.reference()
        );
        jdbcTemplate.update(
                "UPDATE room_night SET reserved_until = NOW() - INTERVAL 1 MINUTE WHERE booking_id = (" +
                "  SELECT id FROM booking WHERE reference = ?" +
                ")",
                booking.reference()
        );

        int expiredCount = bookingExpiryJob.expireLapsedHolds();
        assertThat(expiredCount).isEqualTo(1);

        // Assert booking is now EXPIRED
        String status = jdbcTemplate.queryForObject(
                "SELECT status FROM booking WHERE reference = ?",
                String.class,
                booking.reference()
        );
        assertThat(status).isEqualTo("EXPIRED");

        // Assert nights are released
        Integer reservedNights = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE booking_id = (" +
                "  SELECT id FROM booking WHERE reference = ?" +
                ")",
                Integer.class,
                booking.reference()
        );
        assertThat(reservedNights).isEqualTo(0);
    }

    @Test
    @DisplayName("EXP-02: Expiry job leaves live holds and CONFIRMED bookings alone")
    void testLeavesLiveHoldsAndConfirmedAlone() {
        // 1. Live hold
        BookingResponse live = createBooking("Live User", "live@exp.io");

        // 2. Confirmed booking
        BookingResponse toConfirm = createBooking("Confirmed User", "confirmed@exp.io");
        bookingService.confirm(toConfirm.reference(), "confirmed@exp.io");

        // Run expiry job
        int expired = bookingExpiryJob.expireLapsedHolds();
        assertThat(expired).isEqualTo(0);

        // Verify live hold still HELD
        String liveStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM booking WHERE reference = ?",
                String.class,
                live.reference()
        );
        assertThat(liveStatus).isEqualTo("HELD");

        // Verify confirmed booking still CONFIRMED
        String confirmedStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM booking WHERE reference = ?",
                String.class,
                toConfirm.reference()
        );
        assertThat(confirmedStatus).isEqualTo("CONFIRMED");
    }

    @Test
    @DisplayName("EXP-03: Expiry job is idempotent; repeated runs modify zero additional rows")
    void testExpiryJobIdempotent() {
        BookingResponse booking = createBooking("Double Expiry", "double@exp.io");

        jdbcTemplate.update(
                "UPDATE booking SET expires_at = NOW() - INTERVAL 1 MINUTE WHERE reference = ?",
                booking.reference()
        );
        jdbcTemplate.update(
                "UPDATE room_night SET reserved_until = NOW() - INTERVAL 1 MINUTE WHERE booking_id = (" +
                "  SELECT id FROM booking WHERE reference = ?" +
                ")",
                booking.reference()
        );

        // First run expires 1
        int run1 = bookingExpiryJob.expireLapsedHolds();
        assertThat(run1).isEqualTo(1);

        // Second run expires 0
        int run2 = bookingExpiryJob.expireLapsedHolds();
        assertThat(run2).isEqualTo(0);
    }

    @Test
    @DisplayName("EXP-04: Expiry frees room_nights to AVAILABLE and room can immediately be re-reserved")
    void testExpiryFreesNightsForNewBooking() {
        BookingResponse first = createBooking("First User", "first@exp.io");

        jdbcTemplate.update(
                "UPDATE booking SET expires_at = NOW() - INTERVAL 1 MINUTE WHERE reference = ?",
                first.reference()
        );
        jdbcTemplate.update(
                "UPDATE room_night SET reserved_until = NOW() - INTERVAL 1 MINUTE WHERE booking_id = (" +
                "  SELECT id FROM booking WHERE reference = ?" +
                ")",
                first.reference()
        );

        bookingExpiryJob.expireLapsedHolds();

        // New booking can now be reserved for the exact same hotel and dates
        BookingResponse second = createBooking("Second User", "second@exp.io");
        assertThat(second.status()).isEqualTo("HELD");
        assertThat(second.reference()).isNotEqualTo(first.reference());
    }
}
