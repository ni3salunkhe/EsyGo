package com.hotelbooking.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enables Spring task scheduling for periodic background jobs such as hold expiry.
 */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "app.expiry.enabled", havingValue = "true", matchIfMissing = true)
public class SchedulingConfig {
}
