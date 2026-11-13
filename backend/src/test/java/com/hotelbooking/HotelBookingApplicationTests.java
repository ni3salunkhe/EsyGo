package com.hotelbooking;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class HotelBookingApplicationTests {

    @Test
    @DisplayName("SCAF-03: application context loads successfully under test profile")
    void contextLoads() {
        // Verifies the layered Spring Boot application context initializes cleanly
    }
}
