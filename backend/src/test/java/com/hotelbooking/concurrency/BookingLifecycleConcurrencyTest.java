package com.hotelbooking.concurrency;

import com.hotelbooking.dto.BookingResponse;
import com.hotelbooking.dto.ReserveBookingRequest;
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
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class BookingLifecycleConcurrencyTest {

    @Autowired
    private BookingService bookingService;

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
    @DisplayName("CONC-04: 10 concurrent cancels of one booking -> nights released once, all responses 200, invariants hold")
    void testConcurrentCancels() throws Exception {
        ReserveBookingRequest reserveRequest = new ReserveBookingRequest(
                1L,
                checkIn,
                checkOut,
                "Cancel User",
                "cancel@user.io"
        );
        BookingResponse reserved = bookingService.reserve(reserveRequest);
        String reference = reserved.reference();

        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Future<String>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            Callable<String> task = () -> {
                readyLatch.countDown();
                startLatch.await();
                try {
                    BookingResponse resp = bookingService.cancel(reference, "cancel@user.io");
                    return "STATUS:" + resp.status();
                } catch (Throwable t) {
                    return "ERROR:" + t.getClass().getSimpleName() + ":" + t.getMessage();
                }
            };
            futures.add(executor.submit(task));
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        int successCount = 0;
        int errorCount = 0;
        List<String> errors = new ArrayList<>();

        for (Future<String> future : futures) {
            String outcome = future.get(15, TimeUnit.SECONDS);
            if ("STATUS:CANCELLED".equals(outcome)) {
                successCount++;
            } else {
                errorCount++;
                errors.add(outcome);
            }
        }
        executor.shutdown();

        assertThat(errorCount).as("Unexpected errors: %s", errors).isEqualTo(0);
        assertThat(successCount).as("All concurrent cancels should return 200 CANCELLED").isEqualTo(threadCount);

        // Assert DB state: status CANCELLED and nights released back to AVAILABLE
        String finalStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM booking WHERE reference = ?",
                String.class,
                reference
        );
        assertThat(finalStatus).isEqualTo("CANCELLED");

        Long bookingId = jdbcTemplate.queryForObject(
                "SELECT id FROM booking WHERE reference = ?",
                Long.class,
                reference
        );
        Integer holdingNights = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE booking_id = ?",
                Integer.class,
                bookingId
        );
        assertThat(holdingNights).isEqualTo(0);
    }

    @Test
    @DisplayName("CONC-05: 10 concurrent confirms of one booking -> one transition, all responses 200, invariants hold")
    void testConcurrentConfirms() throws Exception {
        ReserveBookingRequest reserveRequest = new ReserveBookingRequest(
                1L,
                checkIn,
                checkOut,
                "Confirm User",
                "confirm@user.io"
        );
        BookingResponse reserved = bookingService.reserve(reserveRequest);
        String reference = reserved.reference();

        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Future<String>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            Callable<String> task = () -> {
                readyLatch.countDown();
                startLatch.await();
                try {
                    BookingResponse resp = bookingService.confirm(reference, "confirm@user.io");
                    return "STATUS:" + resp.status();
                } catch (Throwable t) {
                    return "ERROR:" + t.getClass().getSimpleName() + ":" + t.getMessage();
                }
            };
            futures.add(executor.submit(task));
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        int successCount = 0;
        int errorCount = 0;
        List<String> errors = new ArrayList<>();

        for (Future<String> future : futures) {
            String outcome = future.get(15, TimeUnit.SECONDS);
            if ("STATUS:CONFIRMED".equals(outcome)) {
                successCount++;
            } else {
                errorCount++;
                errors.add(outcome);
            }
        }
        executor.shutdown();

        assertThat(errorCount).as("Unexpected errors: %s", errors).isEqualTo(0);
        assertThat(successCount).as("All concurrent confirms should return 200 CONFIRMED").isEqualTo(threadCount);

        // Assert DB state: status CONFIRMED and exactly 3 nights are BOOKED
        String finalStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM booking WHERE reference = ?",
                String.class,
                reference
        );
        assertThat(finalStatus).isEqualTo("CONFIRMED");

        Long bookingId = jdbcTemplate.queryForObject(
                "SELECT id FROM booking WHERE reference = ?",
                Long.class,
                reference
        );
        Integer bookedNights = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE booking_id = ? AND status = 'BOOKED' AND reserved_until IS NULL",
                Integer.class,
                bookingId
        );
        assertThat(bookedNights).isEqualTo(3);
    }
}
