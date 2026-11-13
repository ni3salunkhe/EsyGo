package com.hotelbooking.repository;

import com.hotelbooking.domain.Booking;
import com.hotelbooking.domain.BookingStatus;
import com.hotelbooking.domain.Hotel;
import com.hotelbooking.domain.Room;
import com.hotelbooking.testutil.TestDatabaseBootstrap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class BookingRepositoryTest {

    @Autowired
    private TestDatabaseBootstrap bootstrap;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Hotel hotel;
    private Room room1;
    private Room room2;

    @BeforeEach
    void setUp() {
        bootstrap.resetSchema();
        bootstrap.applySeed();

        hotel = hotelRepository.findById(1L).orElseThrow();
        room1 = roomRepository.findById(1L).orElseThrow();
        room2 = roomRepository.findById(2L).orElseThrow();
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        jdbcTemplate.update("DELETE FROM room_night WHERE booking_id IS NOT NULL");
        jdbcTemplate.update("DELETE FROM booking");
    }

    private Booking createHeldBooking(String reference) {
        Booking booking = new Booking();
        booking.setReference(reference);
        booking.setHotel(hotel);
        booking.setRoom(room1);
        booking.setGuestName("Test Guest");
        booking.setGuestEmail("guest@test.io");
        booking.setCheckIn(LocalDate.now().plusDays(5));
        booking.setCheckOut(LocalDate.now().plusDays(7));
        booking.setNights(2);
        booking.setPricePerNight(new BigDecimal("4500.00"));
        booking.setTotalAmount(new BigDecimal("9000.00"));
        booking.setStatus(BookingStatus.HELD);
        booking.setExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        return bookingRepository.save(booking);
    }

    @Test
    @DisplayName("T-REPO-08: confirmBooking transitions status HELD -> CONFIRMED and clears expires_at")
    void confirmBooking_transitionsStatusAndClearsExpiry() {
        Booking booking = createHeldBooking("HB-TEST01");

        int affected = bookingRepository.confirmBooking(booking.getId());
        assertThat(affected).isEqualTo(1);

        Booking updated = bookingRepository.findById(booking.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(updated.getExpiresAt()).isNull();
    }

    @Test
    @DisplayName("T-REPO-09: confirmBooking returns 0 if booking is not in HELD status (idempotency guard)")
    void confirmBooking_guardedByStatusHeld() {
        Booking booking = createHeldBooking("HB-TEST02");
        bookingRepository.confirmBooking(booking.getId());

        // Second confirm call returns 0 affected rows (already CONFIRMED)
        int secondAttempt = bookingRepository.confirmBooking(booking.getId());
        assertThat(secondAttempt).isEqualTo(0);
    }

    @Test
    @DisplayName("T-REPO-10: cancelBooking transitions status HELD or CONFIRMED -> CANCELLED")
    void cancelBooking_transitionsFromHeldOrConfirmed() {
        Booking heldBooking = createHeldBooking("HB-TEST03");
        int cancelledHeld = bookingRepository.cancelBooking(heldBooking.getId());
        assertThat(cancelledHeld).isEqualTo(1);

        Booking confirmedBooking = createHeldBooking("HB-TEST04");
        bookingRepository.confirmBooking(confirmedBooking.getId());
        int cancelledConfirmed = bookingRepository.cancelBooking(confirmedBooking.getId());
        assertThat(cancelledConfirmed).isEqualTo(1);

        Booking reloaded = bookingRepository.findById(confirmedBooking.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(BookingStatus.CANCELLED);
    }

    @Test
    @DisplayName("T-REPO-11: cancelBooking returns 0 if booking is already CANCELLED or EXPIRED")
    void cancelBooking_guardedAgainstInvalidStatus() {
        Booking booking = createHeldBooking("HB-TEST05");
        bookingRepository.cancelBooking(booking.getId());

        // Second cancel attempt returns 0
        int secondCancel = bookingRepository.cancelBooking(booking.getId());
        assertThat(secondCancel).isEqualTo(0);
    }

    @Test
    @DisplayName("T-REPO-12: reassignRoom updates booking.room_id on candidate fallback (amendment A1)")
    void reassignRoom_updatesRoomId() {
        Booking booking = createHeldBooking("HB-TEST06");
        assertThat(booking.getRoom().getId()).isEqualTo(room1.getId());

        int affected = bookingRepository.reassignRoom(booking.getId(), room2.getId());
        assertThat(affected).isEqualTo(1);

        Long currentRoomId = jdbcTemplate.queryForObject(
                "SELECT room_id FROM booking WHERE id = ?",
                Long.class,
                booking.getId()
        );
        assertThat(currentRoomId).isEqualTo(room2.getId());
    }

    @Test
    @DisplayName("T-REPO-EXP: expireBookings transitions expired HELD bookings to EXPIRED")
    void expireBookings_transitionsExpiredHeldBookings() {
        Booking booking = createHeldBooking("HB-TEST07");

        // Move expires_at into the past in the database (rule 40)
        jdbcTemplate.update(
                "UPDATE booking SET expires_at = NOW() - INTERVAL 1 MINUTE WHERE id = ?",
                booking.getId()
        );

        int expired = bookingRepository.expireBookings();
        assertThat(expired).isGreaterThanOrEqualTo(1);

        Booking reloaded = bookingRepository.findById(booking.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(BookingStatus.EXPIRED);
    }
}
