package com.hotelbooking.database;

import com.hotelbooking.testutil.TestDatabaseBootstrap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class DatabaseSchemaValidationTest {

    @Autowired
    private TestDatabaseBootstrap bootstrap;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        bootstrap.resetSchema();
    }

    @Test
    @DisplayName("DB-01: db/schema.sql applies cleanly to empty test database and creates all 6 tables")
    void schemaAppliesCleanlyToEmptyDb() {
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()",
                String.class
        );

        assertThat(tables)
                .contains(
                        "hotel",
                        "amenity",
                        "hotel_amenity",
                        "room",
                        "booking",
                        "room_night"
                );

        // Verify key columns and constraints exist
        Integer hotelColCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'hotel'",
                Integer.class
        );
        assertThat(hotelColCount).isGreaterThanOrEqualTo(7);

        Integer roomNightColCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'room_night'",
                Integer.class
        );
        assertThat(roomNightColCount).isGreaterThanOrEqualTo(5);
    }
}
