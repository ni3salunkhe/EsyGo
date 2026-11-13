package com.hotelbooking.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

/**
 * Repository for inventory operations and atomic guarded status transitions on room_night.
 * Adheres strictly to docs/03-flows.md.
 */
@Repository
public class RoomNightRepository {

    private final JdbcTemplate jdbcTemplate;

    public RoomNightRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Finds up to 'limit' candidate rooms of the specified hotel having all nights AVAILABLE in [checkIn, checkOut).
     * Row lock ordering: sorted by room_id ASC.
     */
    public List<Long> findCandidateRooms(Long hotelId, LocalDate checkIn, LocalDate checkOut, int nights, int limit) {
        String sql = """
                SELECT r.id
                FROM room r
                JOIN room_night rn ON rn.room_id = r.id
                WHERE r.hotel_id = ?
                  AND rn.stay_date >= ?
                  AND rn.stay_date < ?
                  AND rn.status = 'AVAILABLE'
                GROUP BY r.id
                HAVING COUNT(*) = ?
                ORDER BY r.id ASC
                LIMIT ?
                """;
        return jdbcTemplate.queryForList(
                sql,
                Long.class,
                hotelId,
                Date.valueOf(checkIn),
                Date.valueOf(checkOut),
                nights,
                limit
        );
    }

    /**
     * Attempts atomic conditional claim of room nights for [checkIn, checkOut).
     *
     * @return number of affected rows (equals nights if successful)
     */
    public int claimRoomNights(Long roomId, LocalDate checkIn, LocalDate checkOut, Long bookingId, int holdMinutes) {
        String sql = """
                UPDATE room_night
                SET status = 'RESERVED',
                    booking_id = ?,
                    reserved_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)
                WHERE room_id = ?
                  AND stay_date >= ?
                  AND stay_date < ?
                  AND status = 'AVAILABLE'
                """;
        return jdbcTemplate.update(
                sql,
                bookingId,
                holdMinutes,
                roomId,
                Date.valueOf(checkIn),
                Date.valueOf(checkOut)
        );
    }

    /**
     * Reverts a partial claim during reserve fallback. Reverts only rows claimed by this booking.
     */
    public int revertPartialClaim(Long bookingId) {
        String sql = """
                UPDATE room_night
                SET status = 'AVAILABLE',
                    booking_id = NULL,
                    reserved_until = NULL
                WHERE booking_id = ?
                """;
        return jdbcTemplate.update(sql, bookingId);
    }

    /**
     * Confirms room nights held by a booking.
     * Guarded by: status = 'RESERVED' AND reserved_until > NOW().
     */
    public int confirmRoomNights(Long bookingId) {
        String sql = """
                UPDATE room_night
                SET status = 'BOOKED',
                    reserved_until = NULL
                WHERE booking_id = ?
                  AND status = 'RESERVED'
                  AND reserved_until > NOW()
                """;
        return jdbcTemplate.update(sql, bookingId);
    }

    /**
     * Releases room nights on booking cancellation.
     */
    public int releaseRoomNights(Long bookingId) {
        String sql = """
                UPDATE room_night
                SET status = 'AVAILABLE',
                    booking_id = NULL,
                    reserved_until = NULL
                WHERE booking_id = ?
                """;
        return jdbcTemplate.update(sql, bookingId);
    }

    /**
     * Releases lapsed holds on expiry job execution.
     * Guarded by: status = 'RESERVED' AND reserved_until < NOW().
     */
    public int expireRoomNights() {
        String sql = """
                UPDATE room_night
                SET status = 'AVAILABLE',
                    booking_id = NULL,
                    reserved_until = NULL
                WHERE status = 'RESERVED'
                  AND reserved_until < NOW()
                """;
        return jdbcTemplate.update(sql);
    }

    /**
     * Counts AVAILABLE nights for a room in [checkIn, checkOut).
     */
    public int countAvailableNights(Long roomId, LocalDate checkIn, LocalDate checkOut) {
        String sql = """
                SELECT COUNT(*)
                FROM room_night
                WHERE room_id = ?
                  AND stay_date >= ?
                  AND stay_date < ?
                  AND status = 'AVAILABLE'
                """;
        Integer count = jdbcTemplate.queryForObject(
                sql,
                Integer.class,
                roomId,
                Date.valueOf(checkIn),
                Date.valueOf(checkOut)
        );
        return count != null ? count : 0;
    }
}
