package com.hotelbooking.service;

import com.hotelbooking.domain.Booking;
import com.hotelbooking.domain.BookingStatus;
import com.hotelbooking.domain.Hotel;
import com.hotelbooking.domain.Room;
import com.hotelbooking.dto.BookingResponse;
import com.hotelbooking.dto.FieldErrorItem;
import com.hotelbooking.dto.ReserveBookingRequest;
import com.hotelbooking.exception.ResourceNotFoundException;
import com.hotelbooking.exception.SoldOutException;
import com.hotelbooking.exception.ValidationException;
import com.hotelbooking.repository.BookingRepository;
import com.hotelbooking.repository.HotelRepository;
import com.hotelbooking.repository.RoomNightRepository;
import com.hotelbooking.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Transactional boundary for the Reserve workflow adhering strictly to docs/03-flows.md.
 * Kept in a separate bean from BookingService to avoid Spring proxy self-invocation issues during retries.
 */
@Service
public class BookingTransactionalService {

    private final BookingValidator bookingValidator;
    private final PricingService pricingService;
    private final ReferenceGenerator referenceGenerator;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final RoomNightRepository roomNightRepository;
    private final BookingRepository bookingRepository;
    private final Clock clock;
    private final int holdMinutes;
    private final int maxCandidateRooms;

    public BookingTransactionalService(
            BookingValidator bookingValidator,
            PricingService pricingService,
            ReferenceGenerator referenceGenerator,
            HotelRepository hotelRepository,
            RoomRepository roomRepository,
            RoomNightRepository roomNightRepository,
            BookingRepository bookingRepository,
            Clock clock,
            @Value("${app.booking.hold-minutes:10}") int holdMinutes,
            @Value("${app.booking.max-candidate-rooms:5}") int maxCandidateRooms
    ) {
        this.bookingValidator = bookingValidator;
        this.pricingService = pricingService;
        this.referenceGenerator = referenceGenerator;
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.roomNightRepository = roomNightRepository;
        this.bookingRepository = bookingRepository;
        this.clock = clock;
        this.holdMinutes = holdMinutes;
        this.maxCandidateRooms = maxCandidateRooms;
    }

    @Transactional
    public BookingResponse reserve(ReserveBookingRequest request) {
        if (request == null) {
            throw new ValidationException("request", "Request body is required");
        }

        // 1. Validate inputs per docs/02 Section 8
        bookingValidator.validateReserveRequest(
                request.hotelId(),
                request.checkIn(),
                request.checkOut(),
                request.guestName(),
                request.guestEmail()
        );

        // 2. Load hotel (404 if absent)
        Hotel hotel = hotelRepository.findById(request.hotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + request.hotelId()));

        int nights = pricingService.calculateNights(request.checkIn(), request.checkOut());
        BigDecimal totalAmount = pricingService.calculateTotal(nights, hotel.getPricePerNight());

        // 3. Find candidate rooms sorted by room_id ASC
        List<Long> candidateRoomIds = roomNightRepository.findCandidateRooms(
                hotel.getId(),
                request.checkIn(),
                request.checkOut(),
                nights,
                maxCandidateRooms
        );
        if (candidateRoomIds.isEmpty()) {
            throw new SoldOutException();
        }

        String normalizedEmail = bookingValidator.normalizeEmail(request.guestEmail());
        String trimmedName = request.guestName().trim();
        String reference = referenceGenerator.generateUniqueReference(bookingRepository::existsByReference);

        Long firstCandidateId = candidateRoomIds.get(0);
        Room firstRoom = roomRepository.findById(firstCandidateId)
                .orElseThrow(() -> new IllegalStateException("Candidate room not found: " + firstCandidateId));

        Instant now = Instant.now(clock);
        Instant expiresAt = now.plus(Duration.ofMinutes(holdMinutes));

        Booking booking = new Booking();
        booking.setReference(reference);
        booking.setHotel(hotel);
        booking.setRoom(firstRoom);
        booking.setGuestName(trimmedName);
        booking.setGuestEmail(normalizedEmail);
        booking.setCheckIn(request.checkIn());
        booking.setCheckOut(request.checkOut());
        booking.setNights(nights);
        booking.setPricePerNight(hotel.getPricePerNight().setScale(2, RoundingMode.HALF_UP));
        booking.setTotalAmount(totalAmount);
        booking.setStatus(BookingStatus.HELD);
        booking.setExpiresAt(expiresAt);

        Booking savedBooking = bookingRepository.saveAndFlush(booking);

        // 4. Candidate claim loop
        Room claimedRoom = null;
        for (int i = 0; i < candidateRoomIds.size(); i++) {
            Long candidateId = candidateRoomIds.get(i);
            if (i > 0) {
                bookingRepository.reassignRoom(savedBooking.getId(), candidateId);
            }

            int affected = roomNightRepository.claimRoomNights(
                    candidateId,
                    request.checkIn(),
                    request.checkOut(),
                    savedBooking.getId(),
                    holdMinutes
            );

            if (affected == nights) {
                claimedRoom = (i == 0) ? firstRoom : roomRepository.findById(candidateId).orElse(firstRoom);
                if (i > 0) {
                    savedBooking.setRoom(claimedRoom);
                }
                break;
            } else {
                roomNightRepository.revertPartialClaim(savedBooking.getId());
            }
        }

        // 5. If no candidate claimed, rollback everything
        if (claimedRoom == null) {
            throw new SoldOutException();
        }

        return new BookingResponse(
                savedBooking.getReference(),
                savedBooking.getStatus().name(),
                hotel.getId(),
                hotel.getName(),
                claimedRoom.getRoomNumber(),
                savedBooking.getGuestName(),
                savedBooking.getGuestEmail(),
                savedBooking.getCheckIn(),
                savedBooking.getCheckOut(),
                savedBooking.getNights(),
                savedBooking.getPricePerNight(),
                savedBooking.getTotalAmount(),
                savedBooking.getExpiresAt(),
                savedBooking.getCreatedAt() != null ? savedBooking.getCreatedAt() : now
        );
    }
}
