package com.hotelbooking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

/**
 * Provides an injectable Clock configured to the application's booking zone ID.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock(@Value("${app.booking.zone-id:Asia/Kolkata}") String zoneId) {
        return Clock.system(ZoneId.of(zoneId));
    }
}
