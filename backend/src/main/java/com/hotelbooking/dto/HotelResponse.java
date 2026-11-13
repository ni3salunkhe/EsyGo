package com.hotelbooking.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.util.List;

/**
 * Hotel response DTO strictly adhering to docs/02-api-contract.md Section 1.
 * Fields marked (dates only) are omitted (not null) when no dates were supplied.
 */
public record HotelResponse(
        Long id,
        String name,
        String location,
        String address,
        String description,
        String imageUrl,
        List<String> images,
        List<String> amenities,
        BigDecimal pricePerNight,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Integer availableRooms,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Integer nights,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        BigDecimal totalAmount
) {
}
