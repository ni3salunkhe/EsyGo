package com.hotelbooking.concurrency;

import com.hotelbooking.dto.BookingResponse;
import com.hotelbooking.dto.ReserveBookingRequest;
import com.hotelbooking.exception.ConcurrencyConflictException;
import com.hotelbooking.exception.SoldOutException;
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
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class BookingConcurrencyTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final LocalDate baseCheckIn = LocalDate.now().plusDays(30);

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
    @DisplayName("CONC-01: 10 concurrent threads book identical range in hotel with 5 rooms -> exactly 5 succeed, 5 sold out, 0 errors, invariants hold")
    void testConcurrentIdenticalRangeBooking() throws Exception {
        int threadCount = 10;
        int totalRooms = 5; // Hotel 4 has 5 rooms in seed data
        Long hotelId = 4L;
        LocalDate checkIn = baseCheckIn;
        LocalDate checkOut = checkIn.plusDays(3); // 3 nights

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Future<String>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            final int index = i;
            Callable<String> task = () -> {
                readyLatch.countDown();
                startLatch.await();
                try {
                    ReserveBookingRequest request = new ReserveBookingRequest(
                            hotelId,
                            checkIn,
                            checkOut,
                            "Concurrent Guest " + index,
                            "guest" + index + "@concurrency.io"
                    );
                    BookingResponse response = bookingService.reserve(request);
                    return "SUCCESS:" + response.reference();
                } catch (SoldOutException e) {
                    return "SOLD_OUT";
                } catch (ConcurrencyConflictException e) {
                    return "CONFLICT";
                } catch (Throwable t) {
                    return "ERROR:" + t.getClass().getSimpleName() + ":" + t.getMessage();
                }
            };
            futures.add(executor.submit(task));
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Release all threads simultaneously

        int successCount = 0;
        int soldOutCount = 0;
        int conflictCount = 0;
        int errorCount = 0;
        List<String> errors = new ArrayList<>();

        for (Future<String> future : futures) {
            String outcome = future.get(15, TimeUnit.SECONDS);
            if (outcome.startsWith("SUCCESS:")) {
                successCount++;
            } else if ("SOLD_OUT".equals(outcome)) {
                soldOutCount++;
            } else if ("CONFLICT".equals(outcome)) {
                conflictCount++;
            } else {
                errorCount++;
                errors.add(outcome);
            }
        }
        executor.shutdown();

        assertThat(errorCount).as("Unexpected errors: %s", errors).isEqualTo(0);
        assertThat(successCount).as("Exactly rooms count should succeed").isEqualTo(totalRooms);
        assertThat(soldOutCount + conflictCount).as("Remaining attempts should fail gracefully").isEqualTo(threadCount - totalRooms);

        // Database assertions
        Integer activeBookings = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM booking WHERE status = 'HELD'",
                Integer.class
        );
        assertThat(activeBookings).isEqualTo(totalRooms);

        // Assert exactly totalRooms * 3 nights are RESERVED
        Integer reservedNights = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE status = 'RESERVED' AND reserved_until > NOW()",
                Integer.class
        );
        assertThat(reservedNights).isEqualTo(totalRooms * 3);

        // Invariant check: No two bookings hold the same room on any night
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

    @Test
    @DisplayName("CONC-02: Mixed overlapping and back-to-back ranges under concurrency -> only 201/409, zero 500s, invariants hold")
    void testConcurrentMixedRangesBooking() throws Exception {
        int threadCount = 12;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        // 4 distinct patterns:
        // A: [base, base + 2)
        // B: [base + 1, base + 3) (overlaps A)
        // C: [base + 2, base + 4) (back-to-back with A)
        // D: [base, base + 4) (spans across)
        LocalDate[][] ranges = new LocalDate[][]{
                {baseCheckIn.plusDays(40), baseCheckIn.plusDays(42)},
                {baseCheckIn.plusDays(41), baseCheckIn.plusDays(43)},
                {baseCheckIn.plusDays(42), baseCheckIn.plusDays(44)},
                {baseCheckIn.plusDays(40), baseCheckIn.plusDays(44)}
        };

        List<Future<String>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            final int index = i;
            final LocalDate[] range = ranges[i % ranges.length];
            Callable<String> task = () -> {
                readyLatch.countDown();
                startLatch.await();
                try {
                    ReserveBookingRequest request = new ReserveBookingRequest(
                            1L,
                            range[0],
                            range[1],
                            "Mixed Guest " + index,
                            "mixed" + index + "@concurrency.io"
                    );
                    BookingResponse response = bookingService.reserve(request);
                    return "SUCCESS:" + response.reference();
                } catch (SoldOutException e) {
                    return "SOLD_OUT";
                } catch (ConcurrencyConflictException e) {
                    return "CONFLICT";
                } catch (Throwable t) {
                    return "ERROR:" + t.getClass().getSimpleName() + ":" + t.getMessage();
                }
            };
            futures.add(executor.submit(task));
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        int successCount = 0;
        int soldOutCount = 0;
        int conflictCount = 0;
        int errorCount = 0;
        List<String> errors = new ArrayList<>();

        for (Future<String> future : futures) {
            String outcome = future.get(15, TimeUnit.SECONDS);
            if (outcome.startsWith("SUCCESS:")) {
                successCount++;
            } else if ("SOLD_OUT".equals(outcome)) {
                soldOutCount++;
            } else if ("CONFLICT".equals(outcome)) {
                conflictCount++;
            } else {
                errorCount++;
                errors.add(outcome);
            }
        }
        executor.shutdown();

        // Must have zero unhandled errors
        assertThat(errorCount).as("Unexpected errors: %s", errors).isEqualTo(0);
        // Total outcomes must sum to threadCount with only valid statuses (success, sold_out, conflict)
        assertThat(successCount + soldOutCount + conflictCount).isEqualTo(threadCount);
        assertThat(successCount).isGreaterThan(0);

        // Invariant check: No two bookings hold the same room on any night
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
