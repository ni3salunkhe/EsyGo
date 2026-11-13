package com.hotelbooking.controller;

import com.hotelbooking.dto.HotelResponse;
import com.hotelbooking.service.HotelService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller exposing Browse, Search, and Hotel Detail endpoints strictly per docs/02-api-contract.md.
 */
@RestController
@RequestMapping("/api/hotels")
public class HotelController {

    private final HotelService hotelService;

    public HotelController(HotelService hotelService) {
        this.hotelService = hotelService;
    }

    /**
     * GET /api/hotels?location=&checkIn=&checkOut=
     * Browse mode (no dates) or Search mode (both dates present).
     * Exactly one date present -> 400 VALIDATION_ERROR.
     */
    @GetMapping
    public ResponseEntity<List<HotelResponse>> searchOrBrowse(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut
    ) {
        List<HotelResponse> responses = hotelService.searchOrBrowseHotels(location, checkIn, checkOut);
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/hotels/{hotelId}?checkIn=&checkOut=
     * Hotel detail mode with all amenities.
     * With dates: returns 200 with availableRooms=0 if sold out.
     * Unknown hotel ID -> 404 NOT_FOUND.
     */
    @GetMapping("/{hotelId}")
    public ResponseEntity<HotelResponse> getHotelDetail(
            @PathVariable Long hotelId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut
    ) {
        HotelResponse response = hotelService.getHotelDetail(hotelId, checkIn, checkOut);
        return ResponseEntity.ok(response);
    }
}
