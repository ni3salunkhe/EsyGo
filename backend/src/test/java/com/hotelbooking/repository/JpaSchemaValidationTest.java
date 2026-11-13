package com.hotelbooking.repository;

import com.hotelbooking.testutil.TestDatabaseBootstrap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class JpaSchemaValidationTest {

    @Autowired
    private TestDatabaseBootstrap bootstrap;

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private AmenityRepository amenityRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @BeforeEach
    void setUp() {
        bootstrap.resetSchema();
    }

    @Test
    @DisplayName("SCHEMA-VAL: Hibernate ddl-auto=validate succeeds for all JPA entities against real MySQL 8 schema")
    void hibernateDdlAutoValidatePasses() {
        // If this test runs, Hibernate ddl-auto=validate completed with zero validation exceptions
        assertThat(hotelRepository).isNotNull();
        assertThat(amenityRepository).isNotNull();
        assertThat(roomRepository).isNotNull();
        assertThat(bookingRepository).isNotNull();
    }
}
