package com.hotelbooking.service;

import com.hotelbooking.repository.BookingRepository;
import com.hotelbooking.repository.RoomNightRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Background job that releases lapsed booking holds every 60 seconds per docs/03-flows.md.
 * Runs in ONE transaction to guarantee atomicity and cross-instance safety.
 */
@Service
public class BookingExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(BookingExpiryJob.class);

    private final RoomNightRepository roomNightRepository;
    private final BookingRepository bookingRepository;

    public BookingExpiryJob(
            RoomNightRepository roomNightRepository,
            BookingRepository bookingRepository
    ) {
        this.roomNightRepository = roomNightRepository;
        this.bookingRepository = bookingRepository;
    }

    /**
     * Executes hold expiry logic in a single atomic transaction.
     * 1. Release room_nights where status='RESERVED' AND reserved_until < NOW()
     * 2. Mark bookings as EXPIRED where status='HELD' AND expires_at < NOW()
     *
     * @return count of expired bookings
     */
    @Transactional
    public int expireLapsedHolds() {
        int expiredNights = roomNightRepository.expireRoomNights();
        int expiredBookings = bookingRepository.expireBookings();

        if (expiredBookings > 0 || expiredNights > 0) {
            log.info("Expired {} lapsed room-nights and marked {} bookings as EXPIRED", expiredNights, expiredBookings);
        }

        return expiredBookings;
    }

    /**
     * Scheduled trigger running with fixed delay configured via app.expiry.fixed-delay-ms.
     */
    @Scheduled(fixedDelayString = "${app.expiry.fixed-delay-ms:60000}")
    public void runScheduledExpiry() {
        expireLapsedHolds();
    }
}
