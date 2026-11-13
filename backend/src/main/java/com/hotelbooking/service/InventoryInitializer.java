package com.hotelbooking.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Idempotently initializes room_night inventory for the configured bookable window.
 * Seeds [today, today + windowDays) for every physical room using INSERT IGNORE.
 */
@Service
public class InventoryInitializer {

    private static final Logger log = LoggerFactory.getLogger(InventoryInitializer.class);
    private static final int BATCH_SIZE = 1000;

    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;
    private final int windowDays;

    public InventoryInitializer(JdbcTemplate jdbcTemplate,
                                Clock clock,
                                @Value("${app.inventory.window-days:365}") int windowDays) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
        this.windowDays = windowDays;
    }

    /**
     * Top up missing room_night inventory for all existing rooms.
     *
     * @return count of newly inserted room_night rows
     */
    @Transactional
    public int initializeInventory() {
        LocalDate today = LocalDate.now(clock);
        List<Long> roomIds = jdbcTemplate.queryForList("SELECT id FROM room ORDER BY id", Long.class);

        if (roomIds.isEmpty()) {
            log.info("No rooms found in database; inventory initialization skipped.");
            return 0;
        }

        Long countBefore = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM room_night", Long.class);
        long initialCount = countBefore != null ? countBefore : 0L;

        String insertSql = "INSERT IGNORE INTO room_night (room_id, stay_date, status) VALUES (?, ?, 'AVAILABLE')";

        List<Object[]> batch = new ArrayList<>(BATCH_SIZE);
        for (Long roomId : roomIds) {
            for (int dayOffset = 0; dayOffset < windowDays; dayOffset++) {
                LocalDate stayDate = today.plusDays(dayOffset);
                batch.add(new Object[]{roomId, Date.valueOf(stayDate)});

                if (batch.size() >= BATCH_SIZE) {
                    executeBatch(insertSql, batch);
                    batch.clear();
                }
            }
        }

        if (!batch.isEmpty()) {
            executeBatch(insertSql, batch);
            batch.clear();
        }

        Long countAfter = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM room_night", Long.class);
        long finalCount = countAfter != null ? countAfter : 0L;
        int inserted = (int) (finalCount - initialCount);

        log.info("Inventory top-up complete: {} new room_night rows created (total: {}).", inserted, finalCount);
        return inserted;
    }

    private void executeBatch(String sql, List<Object[]> batch) {
        jdbcTemplate.batchUpdate(sql, batch, batch.size(), (PreparedStatement ps, Object[] args) -> {
            ps.setLong(1, (Long) args[0]);
            ps.setDate(2, (Date) args[1]);
        });
    }
}
