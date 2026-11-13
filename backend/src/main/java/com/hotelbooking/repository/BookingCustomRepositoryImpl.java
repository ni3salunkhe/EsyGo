package com.hotelbooking.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Implementation of atomic guarded conditional UPDATEs on the booking table.
 * Adheres strictly to docs/03-flows.md state machine and transition guards.
 */
@Repository
public class BookingCustomRepositoryImpl implements BookingCustomRepository {

    private final JdbcTemplate jdbcTemplate;

    public BookingCustomRepositoryImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public int confirmBooking(Long bookingId) {
        String sql = "UPDATE booking SET status = 'CONFIRMED', expires_at = NULL WHERE id = ? AND status = 'HELD'";
        return jdbcTemplate.update(sql, bookingId);
    }

    @Override
    public int cancelBooking(Long bookingId) {
        String sql = "UPDATE booking SET status = 'CANCELLED' WHERE id = ? AND status IN ('HELD', 'CONFIRMED')";
        return jdbcTemplate.update(sql, bookingId);
    }

    @Override
    public int expireBookings() {
        String sql = "UPDATE booking SET status = 'EXPIRED' WHERE status = 'HELD' AND expires_at < NOW()";
        return jdbcTemplate.update(sql);
    }

    @Override
    public int reassignRoom(Long bookingId, Long candidateRoomId) {
        String sql = "UPDATE booking SET room_id = ? WHERE id = ?";
        return jdbcTemplate.update(sql, candidateRoomId, bookingId);
    }
}
