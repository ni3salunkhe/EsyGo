package com.hotelbooking.controller;

import com.hotelbooking.dto.BookingResponse;
import com.hotelbooking.dto.ReserveBookingRequest;
import com.hotelbooking.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

/**
 * Controller exposing booking workflows per docs/02-api-contract.md.
 */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /**
     * POST /api/bookings - reserve room with 10-minute hold.
     * Returns 201 Created + Location: /api/bookings/{reference}.
     */
    @PostMapping
    public ResponseEntity<BookingResponse> reserve(@RequestBody ReserveBookingRequest request) {
        BookingResponse response = bookingService.reserve(request);
        URI location = URI.create("/api/bookings/" + response.reference());
        return ResponseEntity.created(location).body(response);
    }

    /**
     * POST /api/bookings/{reference}/confirm
     * Confirms a held booking. Body: { "email": "..." }
     */
    @PostMapping("/{reference}/confirm")
    public ResponseEntity<BookingResponse> confirm(
            @PathVariable String reference,
            @RequestBody(required = false) com.hotelbooking.dto.EmailVerificationRequest request
    ) {
        String email = request != null ? request.email() : null;
        BookingResponse response = bookingService.confirm(reference, email);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/bookings/{reference}?email=
     * Retrieves a booking by reference and guest email.
     */
    @org.springframework.web.bind.annotation.GetMapping("/{reference}")
    public ResponseEntity<BookingResponse> getBooking(
            @PathVariable String reference,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String email
    ) {
        BookingResponse response = bookingService.get(reference, email);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/bookings/{reference}/cancel
     * Cancels a booking. Body: { "email": "..." }
     */
    @PostMapping("/{reference}/cancel")
    public ResponseEntity<BookingResponse> cancel(
            @PathVariable String reference,
            @RequestBody(required = false) com.hotelbooking.dto.EmailVerificationRequest request
    ) {
        String email = request != null ? request.email() : null;
        BookingResponse response = bookingService.cancel(reference, email);
        return ResponseEntity.ok(response);
    }
}
