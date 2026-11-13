package com.hotelbooking.service;

import com.hotelbooking.domain.Amenity;
import com.hotelbooking.domain.Hotel;
import com.hotelbooking.domain.HotelImage;
import com.hotelbooking.dto.HotelResponse;
import com.hotelbooking.exception.ResourceNotFoundException;
import com.hotelbooking.repository.HotelRepository;
import com.hotelbooking.repository.RoomNightRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class HotelService {

    private final HotelRepository hotelRepository;
    private final RoomNightRepository roomNightRepository;
    private final BookingValidator bookingValidator;
    private final PricingService pricingService;

    public HotelService(
            HotelRepository hotelRepository,
            RoomNightRepository roomNightRepository,
            BookingValidator bookingValidator,
            PricingService pricingService
    ) {
        this.hotelRepository = hotelRepository;
        this.roomNightRepository = roomNightRepository;
        this.bookingValidator = bookingValidator;
        this.pricingService = pricingService;
    }

    /**
     * Browse mode (no dates) or Search mode (both dates present).
     * Exactly one date present -> throws ValidationException (handled by validator).
     */
    public List<HotelResponse> searchOrBrowseHotels(String location, LocalDate checkIn, LocalDate checkOut) {
        bookingValidator.validateSearchDates(checkIn, checkOut);

        if (checkIn == null && checkOut == null) {
            // Browse mode: all hotels, optionally filtered by location (case-insensitive exact match), ordered by name ASC
            List<Hotel> hotels;
            if (location != null && !location.trim().isEmpty()) {
                hotels = hotelRepository.findByLocationIgnoreCaseOrderByNameAsc(location.trim());
            } else {
                hotels = hotelRepository.findAllByOrderByNameAsc();
            }
            return hotels.stream()
                    .map(h -> toResponse(h, null, null, null))
                    .toList();
        }

        // Search mode: both dates present
        int nights = (int) ChronoUnit.DAYS.between(checkIn, checkOut);
        String trimmedLoc = (location != null && !location.trim().isEmpty()) ? location.trim() : null;

        List<RoomNightRepository.HotelAvailability> availabilities =
                roomNightRepository.findAvailableHotels(checkIn, checkOut, nights, trimmedLoc);

        if (availabilities.isEmpty()) {
            return List.of();
        }

        List<Long> hotelIds = availabilities.stream()
                .map(RoomNightRepository.HotelAvailability::hotelId)
                .toList();

        Map<Long, Hotel> hotelMap = hotelRepository.findAllWithAmenitiesByIdIn(hotelIds).stream()
                .collect(Collectors.toMap(Hotel::getId, h -> h));

        List<HotelResponse> responses = new ArrayList<>();
        for (RoomNightRepository.HotelAvailability ha : availabilities) {
            Hotel hotel = hotelMap.get(ha.hotelId());
            if (hotel != null) {
                BigDecimal totalAmount = pricingService.calculateTotal(nights, hotel.getPricePerNight());
                responses.add(toResponse(hotel, ha.availableRooms(), nights, totalAmount));
            }
        }
        return responses;
    }

    /**
     * Hotel detail mode: returns hotel object with all amenities.
     * With dates: returns availableRooms (0 if sold out), nights, totalAmount.
     * Unknown hotel ID -> throws ResourceNotFoundException (404).
     */
    public HotelResponse getHotelDetail(Long hotelId, LocalDate checkIn, LocalDate checkOut) {
        bookingValidator.validateSearchDates(checkIn, checkOut);

        Hotel hotel = hotelRepository.findWithAmenitiesById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + hotelId));

        if (checkIn == null && checkOut == null) {
            return toResponse(hotel, null, null, null);
        }

        int nights = (int) ChronoUnit.DAYS.between(checkIn, checkOut);
        int availableRooms = roomNightRepository.countAvailableRoomsForHotel(hotelId, checkIn, checkOut, nights);
        BigDecimal totalAmount = pricingService.calculateTotal(nights, hotel.getPricePerNight());

        return toResponse(hotel, availableRooms, nights, totalAmount);
    }

    private HotelResponse toResponse(Hotel hotel, Integer availableRooms, Integer nights, BigDecimal totalAmount) {
        List<String> amenities = hotel.getAmenities().stream()
                .map(Amenity::getName)
                .sorted()
                .toList();

        List<String> images = hotel.getImages().stream()
                .map(HotelImage::getImageUrl)
                .toList();

        BigDecimal price = hotel.getPricePerNight().setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = totalAmount != null ? totalAmount.setScale(2, RoundingMode.HALF_UP) : null;

        return new HotelResponse(
                hotel.getId(),
                hotel.getName(),
                hotel.getLocation(),
                hotel.getAddress(),
                hotel.getDescription(),
                hotel.getImageUrl(),
                images,
                amenities,
                price,
                availableRooms,
                nights,
                total
        );
    }
}
