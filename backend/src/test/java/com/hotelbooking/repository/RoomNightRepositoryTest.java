package com.hotelbooking.repository;

import com.hotelbooking.testutil.TestDatabaseBootstrap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class RoomNightRepositoryTest {

    @Autowired
    private TestDatabaseBootstrap bootstrap;

    @Autowired
    private RoomNightRepository roomNightRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private com.hotelbooking.service.InventoryInitializer inventoryInitializer;

    private final Long testHotelId = 1L;
    private final Long testRoomId = 1L;
    private final LocalDate checkIn = LocalDate.now().plusDays(20);
    private final LocalDate checkOut = checkIn.plusDays(3); // 3 nights

    @BeforeEach
    void setUp() {
        bootstrap.resetSchema();
        bootstrap.applySeed();

        // Seed 3 available room_night rows for testRoomId for [checkIn, checkOut)
        jdbcTemplate.update("DELETE FROM room_night WHERE room_id = ?", testRoomId);
        jdbcTemplate.update("INSERT INTO room_night (room_id, stay_date, status) VALUES (?, ?, 'AVAILABLE')",
                testRoomId, Date.valueOf(checkIn));
        jdbcTemplate.update("INSERT INTO room_night (room_id, stay_date, status) VALUES (?, ?, 'AVAILABLE')",
                testRoomId, Date.valueOf(checkIn.plusDays(1)));
        jdbcTemplate.update("INSERT INTO room_night (room_id, stay_date, status) VALUES (?, ?, 'AVAILABLE')",
                testRoomId, Date.valueOf(checkIn.plusDays(2)));
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        jdbcTemplate.update("DELETE FROM room_night WHERE booking_id IS NOT NULL");
        jdbcTemplate.update("DELETE FROM booking");
        jdbcTemplate.update("DELETE FROM room_night WHERE room_id = ?", testRoomId);
    }

    @org.junit.jupiter.api.AfterAll
    static void afterAll(@Autowired TestDatabaseBootstrap bootstrap,
                         @Autowired com.hotelbooking.service.InventoryInitializer inventoryInitializer) {
        bootstrap.resetSchema();
        bootstrap.applySeed();
        inventoryInitializer.initializeInventory();
    }

    private Long createTestBooking(String reference) {
        String sql = """
                INSERT INTO booking (reference, hotel_id, room_id, guest_name, guest_email,
                                     check_in, check_out, nights, price_per_night, total_amount, status, expires_at)
                VALUES (?, ?, ?, 'Test Guest', 'test@guest.io', ?, ?, 3, 4500.00, 13500.00, 'HELD', NOW() + INTERVAL 10 MINUTE)
                """;
        jdbcTemplate.update(sql, reference, testHotelId, testRoomId, Date.valueOf(checkIn), Date.valueOf(checkOut));
        return jdbcTemplate.queryForObject("SELECT id FROM booking WHERE reference = ?", Long.class, reference);
    }

    @Test
    @DisplayName("T-REPO-01: reserve claim succeeds and affected rows equals nights when all nights are AVAILABLE")
    void reserveClaim_success() {
        Long bookingId = createTestBooking("HB-RN001");

        int affected = roomNightRepository.claimRoomNights(testRoomId, checkIn, checkOut, bookingId, 10);
        assertThat(affected).isEqualTo(3);

        Integer reservedCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE booking_id = ? AND status = 'RESERVED' AND reserved_until > NOW()",
                Integer.class,
                bookingId
        );
        assertThat(reservedCount).isEqualTo(3);
    }

    @Test
    @DisplayName("T-REPO-02: reserve claim returns 0 affected rows when any night in range is not AVAILABLE")
    void reserveClaim_conflictWhenNightUnavailable() {
        Long existingBooking = createTestBooking("HB-RN002");
        // Mark the middle night as already RESERVED by existing booking
        jdbcTemplate.update(
                "UPDATE room_night SET status = 'RESERVED', booking_id = ? WHERE room_id = ? AND stay_date = ?",
                existingBooking,
                testRoomId,
                Date.valueOf(checkIn.plusDays(1))
        );

        Long myBooking = createTestBooking("HB-RN003");
        // Attempting to claim the 3-night range fails atomically (affected rows == 2 != 3)
        int affected = roomNightRepository.claimRoomNights(testRoomId, checkIn, checkOut, myBooking, 10);
        assertThat(affected).isEqualTo(2); // Only 2 matched, meaning full claim was NOT acquired

        // Calling revert cleans up partial claim
        roomNightRepository.revertPartialClaim(myBooking);
        Integer myHeldCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE booking_id = ?",
                Integer.class,
                myBooking
        );
        assertThat(myHeldCount).isEqualTo(0);
    }

    @Test
    @DisplayName("T-REPO-03: partial claim revert releases only rows claimed by that specific booking_id")
    void partialClaimRevert_releasesOnlyOwnBooking() {
        Long bookingA = createTestBooking("HB-RN004");
        Long bookingB = createTestBooking("HB-RN005");

        // Booking A holds night 1 and night 2
        jdbcTemplate.update("UPDATE room_night SET status = 'RESERVED', booking_id = ? WHERE room_id = ? AND stay_date IN (?, ?)",
                bookingA, testRoomId, Date.valueOf(checkIn), Date.valueOf(checkIn.plusDays(1)));

        // Booking B holds night 3
        jdbcTemplate.update("UPDATE room_night SET status = 'RESERVED', booking_id = ? WHERE room_id = ? AND stay_date = ?",
                bookingB, testRoomId, Date.valueOf(checkIn.plusDays(2)));

        // Revert Booking A
        int reverted = roomNightRepository.revertPartialClaim(bookingA);
        assertThat(reverted).isEqualTo(2);

        // Booking A rows are AVAILABLE
        Integer availableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE room_id = ? AND status = 'AVAILABLE' AND booking_id IS NULL",
                Integer.class,
                testRoomId
        );
        assertThat(availableCount).isEqualTo(2);

        // Booking B rows remain untouched
        Integer bCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE booking_id = ?",
                Integer.class,
                bookingB
        );
        assertThat(bCount).isEqualTo(1);
    }

    @Test
    @DisplayName("T-REPO-04: confirm claim succeeds when hold is live (reserved_until > NOW()) and sets BOOKED")
    void confirmClaim_beforeDeadlineSucceeds() {
        Long bookingId = createTestBooking("HB-RN006");
        roomNightRepository.claimRoomNights(testRoomId, checkIn, checkOut, bookingId, 10);

        int confirmed = roomNightRepository.confirmRoomNights(bookingId);
        assertThat(confirmed).isEqualTo(3);

        Integer bookedCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE booking_id = ? AND status = 'BOOKED' AND reserved_until IS NULL",
                Integer.class,
                bookingId
        );
        assertThat(bookedCount).isEqualTo(3);
    }

    @Test
    @DisplayName("T-REPO-05: confirm claim fails (affected = 0) when hold deadline has passed (reserved_until <= NOW())")
    void confirmClaim_afterDeadlineFails() {
        Long bookingId = createTestBooking("HB-RN007");
        roomNightRepository.claimRoomNights(testRoomId, checkIn, checkOut, bookingId, 10);

        // Simulate time passing: move reserved_until into the past in the database (rule 40: never sleep)
        jdbcTemplate.update(
                "UPDATE room_night SET reserved_until = NOW() - INTERVAL 1 MINUTE WHERE booking_id = ?",
                bookingId
        );

        int confirmed = roomNightRepository.confirmRoomNights(bookingId);
        assertThat(confirmed).isEqualTo(0);

        // Rows remain RESERVED (for expiry job to tidy up)
        Integer statusCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE booking_id = ? AND status = 'RESERVED'",
                Integer.class,
                bookingId
        );
        assertThat(statusCount).isEqualTo(3);
    }

    @Test
    @DisplayName("T-REPO-06: cancel releases room nights back to AVAILABLE with NULL booking_id and reserved_until")
    void cancelRelease_freesNights() {
        Long bookingId = createTestBooking("HB-RN008");
        roomNightRepository.claimRoomNights(testRoomId, checkIn, checkOut, bookingId, 10);

        int released = roomNightRepository.releaseRoomNights(bookingId);
        assertThat(released).isEqualTo(3);

        Integer availableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE room_id = ? AND status = 'AVAILABLE' AND booking_id IS NULL AND reserved_until IS NULL",
                Integer.class,
                testRoomId
        );
        assertThat(availableCount).isEqualTo(3);
    }

    @Test
    @DisplayName("T-REPO-07: expiry releases only expired holds (reserved_until < NOW()) and leaves live holds intact")
    void expiryRelease_releasesOnlyLapsedHolds() {
        Long liveBooking = createTestBooking("HB-RN009");
        Long expiredBooking = createTestBooking("HB-RN010");

        // Live booking on testRoomId night 1
        jdbcTemplate.update("UPDATE room_night SET status = 'RESERVED', booking_id = ?, reserved_until = NOW() + INTERVAL 5 MINUTE WHERE room_id = ? AND stay_date = ?",
                liveBooking, testRoomId, Date.valueOf(checkIn));

        // Expired booking on testRoomId night 2 (deadline in past)
        jdbcTemplate.update("UPDATE room_night SET status = 'RESERVED', booking_id = ?, reserved_until = NOW() - INTERVAL 2 MINUTE WHERE room_id = ? AND stay_date = ?",
                expiredBooking, testRoomId, Date.valueOf(checkIn.plusDays(1)));

        int expired = roomNightRepository.expireRoomNights();
        assertThat(expired).isGreaterThanOrEqualTo(1);

        // Expired booking night is now AVAILABLE
        String expiredStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM room_night WHERE room_id = ? AND stay_date = ?",
                String.class,
                testRoomId, Date.valueOf(checkIn.plusDays(1))
        );
        assertThat(expiredStatus).isEqualTo("AVAILABLE");

        // Live booking night remains RESERVED
        String liveStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM room_night WHERE room_id = ? AND stay_date = ?",
                String.class,
                testRoomId, Date.valueOf(checkIn)
        );
        assertThat(liveStatus).isEqualTo("RESERVED");
    }

    @Test
    @DisplayName("T-REPO-CAND: findCandidateRooms returns available rooms sorted by room_id ASC")
    void findCandidateRooms_returnsAvailableRoomsSorted() {
        List<Long> candidates = roomNightRepository.findCandidateRooms(testHotelId, checkIn, checkOut, 3, 5);
        assertThat(candidates).contains(testRoomId);
    }
}
