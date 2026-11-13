package com.hotelbooking.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PricingServiceTest {

    private final PricingService pricingService = new PricingService();

    @Test
    @DisplayName("PRC-01: total = nights x price (BigDecimal, scale 2) for 1, 2, 7, 30 nights")
    void calculateTotal_exactMultiplicationWithScale2() {
        BigDecimal rate = new BigDecimal("4500.00");

        // 1 night
        BigDecimal total1 = pricingService.calculateTotal(1, rate);
        assertThat(total1).isEqualTo(new BigDecimal("4500.00"));
        assertThat(total1.scale()).isEqualTo(2);

        // 2 nights
        BigDecimal total2 = pricingService.calculateTotal(2, rate);
        assertThat(total2).isEqualTo(new BigDecimal("9000.00"));
        assertThat(total2.scale()).isEqualTo(2);

        // 7 nights
        BigDecimal total7 = pricingService.calculateTotal(7, rate);
        assertThat(total7).isEqualTo(new BigDecimal("31500.00"));
        assertThat(total7.scale()).isEqualTo(2);

        // 30 nights
        BigDecimal total30 = pricingService.calculateTotal(30, rate);
        assertThat(total30).isEqualTo(new BigDecimal("135000.00"));
        assertThat(total30.scale()).isEqualTo(2);
    }

    @Test
    @DisplayName("PRC-02: nights calculation across month end, year end, and leap day")
    void calculateNights_acrossCalendarBoundaries() {
        // Month boundary (March 30 to April 2 -> 3 nights)
        int monthNights = pricingService.calculateNights(
                LocalDate.of(2026, 3, 30),
                LocalDate.of(2026, 4, 2)
        );
        assertThat(monthNights).isEqualTo(3);

        // Year boundary (Dec 30 to Jan 2 -> 3 nights)
        int yearNights = pricingService.calculateNights(
                LocalDate.of(2026, 12, 30),
                LocalDate.of(2027, 1, 2)
        );
        assertThat(yearNights).isEqualTo(3);

        // Leap year boundary (Feb 28, 2028 to March 1, 2028 -> 2 nights because 2028 is a leap year)
        int leapNights = pricingService.calculateNights(
                LocalDate.of(2028, 2, 28),
                LocalDate.of(2028, 3, 1)
        );
        assertThat(leapNights).isEqualTo(2);

        // Non-leap year boundary (Feb 28, 2027 to March 1, 2027 -> 1 night)
        int nonLeapNights = pricingService.calculateNights(
                LocalDate.of(2027, 2, 28),
                LocalDate.of(2027, 3, 1)
        );
        assertThat(nonLeapNights).isEqualTo(1);
    }

    @Test
    @DisplayName("PRC-03: invalid parameters reject with IllegalArgumentException")
    void calculateTotal_invalidParameters() {
        assertThatThrownBy(() -> pricingService.calculateTotal(0, new BigDecimal("100.00")))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> pricingService.calculateNights(LocalDate.of(2026, 5, 10), LocalDate.of(2026, 5, 10)))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
