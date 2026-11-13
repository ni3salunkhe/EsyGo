package com.hotelbooking.database;

import com.hotelbooking.testutil.TestDatabaseBootstrap;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TestDatabaseBootstrapTest {

    @Test
    @DisplayName("DB-04: TestDatabaseBootstrap accepts valid database names ending with '_test'")
    void acceptsValidTestDatabaseNames() {
        // Should not throw
        TestDatabaseBootstrap.validateDatabaseName("hotel_booking_test");
        TestDatabaseBootstrap.validateDatabaseName("my_app_test");
        TestDatabaseBootstrap.validateDatabaseName("TEST_DB_TEST");
    }

    @Test
    @DisplayName("DB-04: TestDatabaseBootstrap strictly rejects database names not ending with '_test'")
    void refusesNonTestDatabaseNames() {
        assertThatThrownBy(() -> TestDatabaseBootstrap.validateDatabaseName("hotel_booking"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("does not end with '_test'");

        assertThatThrownBy(() -> TestDatabaseBootstrap.validateDatabaseName("production"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("does not end with '_test'");

        assertThatThrownBy(() -> TestDatabaseBootstrap.validateDatabaseName("hotel_booking_testing"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("does not end with '_test'");

        assertThatThrownBy(() -> TestDatabaseBootstrap.validateDatabaseName(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("does not end with '_test'");
    }

    @Test
    @DisplayName("DB-04: parseDatabaseNameFromUrl extracts database catalog cleanly")
    void parseDatabaseNameFromUrlExtractsCleanly() {
        assertThat(TestDatabaseBootstrap.parseDatabaseNameFromUrl("jdbc:mysql://localhost:3306/hotel_booking_test"))
                .isEqualTo("hotel_booking_test");

        assertThat(TestDatabaseBootstrap.parseDatabaseNameFromUrl("jdbc:mysql://127.0.0.1:3306/hotel_booking_test?useSSL=false"))
                .isEqualTo("hotel_booking_test");
    }
}
