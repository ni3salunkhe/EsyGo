package com.hotelbooking.repository;

public interface BookingCustomRepository {

    int confirmBooking(Long bookingId);

    int cancelBooking(Long bookingId);

    int expireBookings();

    int reassignRoom(Long bookingId, Long candidateRoomId);
}
