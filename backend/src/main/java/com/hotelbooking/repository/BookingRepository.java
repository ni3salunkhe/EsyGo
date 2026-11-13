package com.hotelbooking.repository;

import com.hotelbooking.domain.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long>, BookingCustomRepository {

    Optional<Booking> findByReference(String reference);

    boolean existsByReference(String reference);

    Optional<Booking> findByReferenceAndGuestEmailIgnoreCase(String reference, String guestEmail);
}
