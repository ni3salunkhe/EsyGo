package com.hotelbooking.concurrency;

import com.hotelbooking.dto.BookingResponse;
import com.hotelbooking.dto.ReserveBookingRequest;
import com.hotelbooking.exception.HoldExpiredException;
import com.hotelbooking.exception.InvalidStateException;
import com.hotelbooking.service.BookingExpiryJob;
import com.hotelbooking.service.BookingService;
import com.hotelbooking.service.InventoryInitializer;
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
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class ConfirmVsExpiryConcurrencyTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingExpiryJob bookingExpiryJob;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final LocalDate checkIn = LocalDate.now().plusDays(25);
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

    @Test
    @DisplayName("CONC-03: Confirm vs Expiry Job race at the deadline -> exactly one winner, invariants hold")
    void testConfirmVsExpiryRaceAtDeadline() throws Exception {
        ReserveBookingRequest reserveRequest = new ReserveBookingRequest(
                1L,
                checkIn,
                checkOut,
                "Race User",
                "race@user.io"
        );
        BookingResponse reserved = bookingService.reserve(reserveRequest);
        String reference = reserved.reference();

        // Stage deadline right at the lapsed boundary so both confirm and expiry race
        jdbcTemplate.update(
                "UPDATE booking SET expires_at = NOW() - INTERVAL 1 SECOND WHERE reference = ?",
                reference
        );
        jdbcTemplate.update(
                "UPDATE room_night SET reserved_until = NOW() - INTERVAL 1 SECOND WHERE booking_id = (" +
                "  SELECT id FROM booking WHERE reference = ?" +
                ")",
                reference
        );

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch readyLatch = new CountDownLatch(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        Callable<String> confirmTask = () -> {
            readyLatch.countDown();
            startLatch.await();
            try {
                BookingResponse resp = bookingService.confirm(reference, "race@user.io");
                return "CONFIRM_SUCCESS:" + resp.status();
            } catch (HoldExpiredException | InvalidStateException e) {
                return "CONFIRM_HOLD_EXPIRED";
            } catch (Throwable t) {
                return "CONFIRM_ERROR:" + t.getClass().getSimpleName() + ":" + t.getMessage();
            }
        };

        Callable<String> expiryTask = () -> {
            readyLatch.countDown();
            startLatch.await();
            try {
                int expired = bookingExpiryJob.expireLapsedHolds();
                return "EXPIRY_COUNT:" + expired;
            } catch (Throwable t) {
                return "EXPIRY_ERROR:" + t.getClass().getSimpleName() + ":" + t.getMessage();
            }
        };

        Future<String> confirmFuture = executor.submit(confirmTask);
        Future<String> expiryFuture = executor.submit(expiryTask);

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        String confirmOutcome = confirmFuture.get(10, TimeUnit.SECONDS);
        String expiryOutcome = expiryFuture.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(confirmOutcome).doesNotContain("ERROR");
        assertThat(expiryOutcome).doesNotContain("ERROR");

        String finalStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM booking WHERE reference = ?",
                String.class,
                reference
        );

        // Exactly one coherent state
        if ("CONFIRM_SUCCESS:CONFIRMED".equals(confirmOutcome)) {
            // Confirm won
            assertThat(finalStatus).isEqualTo("CONFIRMED");
            Integer bookedNights = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM room_night WHERE status = 'BOOKED' AND booking_id = (" +
                    "  SELECT id FROM booking WHERE reference = ?" +
                    ")",
                    Integer.class,
                    reference
            );
            assertThat(bookedNights).isEqualTo(3);
        } else {
            // Expiry won
            assertThat(confirmOutcome).isEqualTo("CONFIRM_HOLD_EXPIRED");
            assertThat(finalStatus).isEqualTo("EXPIRED");
            Integer holdingNights = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM room_night WHERE booking_id = (" +
                    "  SELECT id FROM booking WHERE reference = ?" +
                    ")",
                    Integer.class,
                    reference
            );
            assertThat(holdingNights).isEqualTo(0);
        }

        // Database invariant check: 0 duplicate room_nights
        Integer doubleBookings = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM (" +
                "  SELECT room_id, stay_date, COUNT(*) AS cnt FROM room_night " +
                "  WHERE booking_id IS NOT NULL " +
                "  GROUP BY room_id, stay_date HAVING cnt > 1" +
                ") duplicates",
                Integer.class
        );
        assertThat(doubleBookings).isEqualTo(0);
    }
}
