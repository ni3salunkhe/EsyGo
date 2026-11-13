package com.hotelbooking.controller;

import com.hotelbooking.dto.BookingResponse;
import com.hotelbooking.dto.ReserveBookingRequest;
import com.hotelbooking.service.BookingService;
import org.springframework.http.ResponseEntity;
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
}
