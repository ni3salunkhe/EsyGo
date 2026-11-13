package com.hotelbooking.service;

import com.hotelbooking.dto.BookingResponse;
import com.hotelbooking.dto.ReserveBookingRequest;
import org.springframework.stereotype.Service;

/**
 * Service facade for booking operations.
 * Wraps transactional units with DeadlockRetryWrapper to handle MySQL 1213 deadlocks safely.
 */
@Service
public class BookingService {

    private final BookingTransactionalService bookingTransactionalService;
    private final DeadlockRetryWrapper deadlockRetryWrapper;

    public BookingService(
            BookingTransactionalService bookingTransactionalService,
            DeadlockRetryWrapper deadlockRetryWrapper
    ) {
        this.bookingTransactionalService = bookingTransactionalService;
        this.deadlockRetryWrapper = deadlockRetryWrapper;
    }

    public BookingResponse reserve(ReserveBookingRequest request) {
        return deadlockRetryWrapper.runWithRetry(() -> bookingTransactionalService.reserve(request));
    }
}
