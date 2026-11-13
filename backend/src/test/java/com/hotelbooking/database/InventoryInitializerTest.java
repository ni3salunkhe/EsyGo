package com.hotelbooking.database;

import com.hotelbooking.service.InventoryInitializer;
import com.hotelbooking.testutil.TestDatabaseBootstrap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class InventoryInitializerTest {

    @Autowired
    private TestDatabaseBootstrap bootstrap;

    @Autowired
    private InventoryInitializer inventoryInitializer;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${app.inventory.window-days:365}")
    private int windowDays;

    @BeforeEach
    void setUp() {
        bootstrap.resetSchema();
        bootstrap.applySeed();
    }

    @Test
    @DisplayName("DB-03: InventoryInitializer creates exactly rooms x window-days rows on first run and 0 on second run (idempotent)")
    void inventoryInitializationIsExactAndIdempotent() {
        Integer roomCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM room", Integer.class);
        assertThat(roomCount).isNotNull().isEqualTo(25);

        int expectedRows = 25 * windowDays; // 25 * 365 = 9,125

        // Initial state before running inventory top-up
        Integer initialCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM room_night", Integer.class);
        assertThat(initialCount).isEqualTo(0);

        // First run: top up all rooms for [today, today + 365)
        int insertedFirstRun = inventoryInitializer.initializeInventory();
        assertThat(insertedFirstRun).isEqualTo(expectedRows);

        Integer totalAfterFirstRun = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM room_night", Integer.class);
        assertThat(totalAfterFirstRun).isEqualTo(expectedRows);

        // Second run: must be completely idempotent and add 0 rows
        int insertedSecondRun = inventoryInitializer.initializeInventory();
        assertThat(insertedSecondRun).isEqualTo(0);

        Integer totalAfterSecondRun = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM room_night", Integer.class);
        assertThat(totalAfterSecondRun).isEqualTo(expectedRows);
    }
}
