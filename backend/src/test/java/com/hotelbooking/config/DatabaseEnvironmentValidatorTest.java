package com.hotelbooking.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DatabaseEnvironmentValidatorTest {

    @Test
    @DisplayName("SCAF-02: startup fails fast when DB_URL is missing")
    void missingDbUrl_failsFast() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DB_USERNAME", "root");
        env.setProperty("DB_PASSWORD", "12345678");

        assertThatThrownBy(() -> DatabaseEnvironmentValidator.validateEnvironment(env, false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Missing required database environment variable: 'DB_URL'");
    }

    @Test
    @DisplayName("SCAF-02: startup fails fast when DB_USERNAME is missing")
    void missingDbUsername_failsFast() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DB_URL", "jdbc:mysql://localhost:3306/hotel_booking");
        env.setProperty("DB_PASSWORD", "12345678");

        assertThatThrownBy(() -> DatabaseEnvironmentValidator.validateEnvironment(env, false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Missing required database environment variable: 'DB_USERNAME'");
    }

    @Test
    @DisplayName("SCAF-02: startup fails fast when DB_PASSWORD is missing")
    void missingDbPassword_failsFast() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DB_URL", "jdbc:mysql://localhost:3306/hotel_booking");
        env.setProperty("DB_USERNAME", "root");

        assertThatThrownBy(() -> DatabaseEnvironmentValidator.validateEnvironment(env, false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Missing required database environment variable: 'DB_PASSWORD'");
    }

    @Test
    @DisplayName("SCAF-02: startup succeeds when all required DB environment variables are present")
    void allPresent_succeeds() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DB_URL", "jdbc:mysql://localhost:3306/hotel_booking");
        env.setProperty("DB_USERNAME", "root");
        env.setProperty("DB_PASSWORD", "12345678");

        // Should not throw
        DatabaseEnvironmentValidator.validateEnvironment(env, false);
    }

    @Test
    @DisplayName("SCAF-02: test profile bypasses production DB env validation")
    void testProfile_bypassesProdValidation() {
        MockEnvironment env = new MockEnvironment();
        // In test profile, production DB_* variables are not required
        DatabaseEnvironmentValidator.validateEnvironment(env, true);
    }
}
