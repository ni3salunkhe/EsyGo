package com.hotelbooking.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Service for calculating stay duration and total booking amounts.
 * Precision: BigDecimal with scale 2.
 */
@Service
public class PricingService {

    /**
     * Calculates the number of nights for a half-open stay range [checkIn, checkOut).
     *
     * @param checkIn check-in date
     * @param checkOut check-out date
     * @return number of nights
     */
    public int calculateNights(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) {
            throw new IllegalArgumentException("checkIn and checkOut dates must not be null");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("checkOut must be after checkIn");
        }
        return (int) ChronoUnit.DAYS.between(checkIn, checkOut);
    }

    /**
     * Calculates the total amount as nights multiplied by price per night.
     *
     * @param nights number of nights
     * @param pricePerNight base price per night
     * @return total amount formatted to scale 2
     */
    public BigDecimal calculateTotal(int nights, BigDecimal pricePerNight) {
        if (nights <= 0) {
            throw new IllegalArgumentException("nights must be greater than zero");
        }
        if (pricePerNight == null || pricePerNight.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("pricePerNight must be non-null and non-negative");
        }
        return pricePerNight.multiply(BigDecimal.valueOf(nights)).setScale(2, RoundingMode.HALF_UP);
    }
}
