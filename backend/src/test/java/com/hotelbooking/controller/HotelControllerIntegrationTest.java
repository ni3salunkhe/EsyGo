package com.hotelbooking.controller;

import com.hotelbooking.testutil.TestDatabaseBootstrap;
import com.hotelbooking.service.InventoryInitializer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.sql.Date;
import java.time.LocalDate;

import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HotelControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Use future dates within the 365-day inventory window
    private final LocalDate baseCheckIn = LocalDate.now().plusDays(10);
    private final LocalDate baseCheckOut = LocalDate.now().plusDays(13); // 3 nights

    @BeforeAll
    static void initDatabase(
            @Autowired TestDatabaseBootstrap bootstrap,
            @Autowired InventoryInitializer inventoryInitializer) {
        bootstrap.resetSchema();
        bootstrap.applySeed();
        inventoryInitializer.initializeInventory();
    }

    @BeforeEach
    @AfterEach
    void resetHolds() {
        jdbcTemplate.update("UPDATE room_night SET status = 'AVAILABLE', booking_id = NULL, reserved_until = NULL");
        jdbcTemplate.update("DELETE FROM booking");
    }

    @AfterAll
    static void restoreDatabase(
            @Autowired TestDatabaseBootstrap bootstrap,
            @Autowired InventoryInitializer inventoryInitializer) {
        bootstrap.resetSchema();
        bootstrap.applySeed();
        inventoryInitializer.initializeInventory();
    }

    private Long createBooking(Long hotelId, Long roomId, LocalDate in, LocalDate out, String ref) {
        String sql = """
                INSERT INTO booking (reference, hotel_id, room_id, guest_name, guest_email,
                                     check_in, check_out, nights, price_per_night, total_amount, status, expires_at)
                VALUES (?, ?, ?, 'Test Guest', 'guest@test.io', ?, ?, 3, 3000.00, 9000.00, 'HELD', NOW() + INTERVAL 10 MINUTE)
                """;
        jdbcTemplate.update(sql, ref, hotelId, roomId, Date.valueOf(in), Date.valueOf(out));
        return jdbcTemplate.queryForObject("SELECT id FROM booking WHERE reference = ?", Long.class, ref);
    }

    @Test
    @DisplayName("SRC-01: Filter hotels by location case-insensitively")
    void testFilterByLocationCaseInsensitive() throws Exception {
        // Test lower-case "goa"
        mockMvc.perform(get("/api/hotels")
                        .param("location", "goa")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].location", equalTo("Goa")))
                .andExpect(jsonPath("$[1].location", equalTo("Goa")));

        // Test upper-case "GOA"
        mockMvc.perform(get("/api/hotels")
                        .param("location", "GOA")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("SRC-02: Excludes a hotel whose only rooms are held for requested dates")
    void testExcludesHotelWhenRoomsHeld() throws Exception {
        // Hotel 1 has 5 rooms in seed data. Hold all 5 rooms for baseCheckIn..baseCheckOut
        var roomIds = jdbcTemplate.queryForList("SELECT id FROM room WHERE hotel_id = 1", Long.class);
        for (int i = 0; i < roomIds.size(); i++) {
            Long roomId = roomIds.get(i);
            Long bid = createBooking(1L, roomId, baseCheckIn, baseCheckOut, "HB-TEST0" + i);
            jdbcTemplate.update(
                    "UPDATE room_night SET status = 'RESERVED', booking_id = ?, reserved_until = NOW() + INTERVAL 10 MINUTE " +
                    "WHERE room_id = ? AND stay_date >= ? AND stay_date < ?",
                    bid, roomId, Date.valueOf(baseCheckIn), Date.valueOf(baseCheckOut)
            );
        }

        // Search for Hotel 1's location (Goa)
        mockMvc.perform(get("/api/hotels")
                        .param("location", "Goa")
                        .param("checkIn", baseCheckIn.toString())
                        .param("checkOut", baseCheckOut.toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                // Hotel 1 excluded because 0 rooms available; only Hotel 2 remains
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", equalTo(2)));
    }

    @Test
    @DisplayName("SRC-03: Excludes rooms with partial date overlap")
    void testExcludesPartialOverlap() throws Exception {
        // Hold 1 room for days [baseCheckIn, baseCheckIn + 2)
        Long roomId = jdbcTemplate.queryForObject("SELECT id FROM room WHERE hotel_id = 1 ORDER BY id LIMIT 1", Long.class);
        Long bid = createBooking(1L, roomId, baseCheckIn, baseCheckIn.plusDays(2), "HB-OVER01");
        jdbcTemplate.update(
                "UPDATE room_night SET status = 'RESERVED', booking_id = ?, reserved_until = NOW() + INTERVAL 10 MINUTE " +
                "WHERE room_id = ? AND stay_date >= ? AND stay_date < ?",
                bid, roomId, Date.valueOf(baseCheckIn), Date.valueOf(baseCheckIn.plusDays(2))
        );

        // Search for [baseCheckIn + 1, baseCheckIn + 3) -> partial overlap on baseCheckIn + 1
        // Hotel 1 has 6 rooms; with 1 overlapping room, exactly 5 rooms should be available
        mockMvc.perform(get("/api/hotels")
                        .param("location", "Goa")
                        .param("checkIn", baseCheckIn.plusDays(1).toString())
                        .param("checkOut", baseCheckIn.plusDays(3).toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", equalTo(1)))
                .andExpect(jsonPath("$[0].availableRooms", equalTo(5)));
    }

    @Test
    @DisplayName("SRC-04: Back-to-back stays where checkIn equals another checkout date are available")
    void testBackToBackStaysAvailable() throws Exception {
        // Hold room for [baseCheckIn, baseCheckIn + 2)
        Long roomId = jdbcTemplate.queryForObject("SELECT id FROM room WHERE hotel_id = 1 ORDER BY id LIMIT 1", Long.class);
        Long bid = createBooking(1L, roomId, baseCheckIn, baseCheckIn.plusDays(2), "HB-B2B01");
        jdbcTemplate.update(
                "UPDATE room_night SET status = 'RESERVED', booking_id = ?, reserved_until = NOW() + INTERVAL 10 MINUTE " +
                "WHERE room_id = ? AND stay_date >= ? AND stay_date < ?",
                bid, roomId, Date.valueOf(baseCheckIn), Date.valueOf(baseCheckIn.plusDays(2))
        );

        // Next stay begins exactly when the first ends: [baseCheckIn + 2, baseCheckIn + 4)
        // All 6 rooms in Hotel 1 should be available
        mockMvc.perform(get("/api/hotels")
                        .param("location", "Goa")
                        .param("checkIn", baseCheckIn.plusDays(2).toString())
                        .param("checkOut", baseCheckIn.plusDays(4).toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", equalTo(1)))
                .andExpect(jsonPath("$[0].availableRooms", equalTo(6)));
    }

    @Test
    @DisplayName("SRC-05: availableRooms counts distinct rooms, not total nights")
    void testAvailableRoomsCountsRoomsNotNights() throws Exception {
        // 6 rooms in Hotel 1 over 3 nights should report availableRooms = 6 (not 18)
        mockMvc.perform(get("/api/hotels")
                        .param("location", "Goa")
                        .param("checkIn", baseCheckIn.toString())
                        .param("checkOut", baseCheckOut.toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", equalTo(1)))
                .andExpect(jsonPath("$[0].availableRooms", equalTo(6)))
                .andExpect(jsonPath("$[0].nights", equalTo(3)));
    }

    @Test
    @DisplayName("SRC-06: Browse mode returns all hotels with availability fields omitted")
    void testBrowseModeOmitsAvailabilityFields() throws Exception {
        mockMvc.perform(get("/api/hotels")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[0].name", notNullValue()))
                .andExpect(jsonPath("$[0].imageUrl").value(nullValue()))
                .andExpect(jsonPath("$[0].availableRooms").doesNotExist())
                .andExpect(jsonPath("$[0].nights").doesNotExist())
                .andExpect(jsonPath("$[0].totalAmount").doesNotExist());
    }

    @Test
    @DisplayName("SRC-07: Hotel detail with dates returns 200 with availableRooms=0 when sold out")
    void testHotelDetailSoldOutReturns200() throws Exception {
        // Hold all 5 rooms of Hotel 1
        var roomIds = jdbcTemplate.queryForList("SELECT id FROM room WHERE hotel_id = 1", Long.class);
        for (int i = 0; i < roomIds.size(); i++) {
            Long roomId = roomIds.get(i);
            Long bid = createBooking(1L, roomId, baseCheckIn, baseCheckOut, "HB-FULL0" + i);
            jdbcTemplate.update(
                    "UPDATE room_night SET status = 'RESERVED', booking_id = ?, reserved_until = NOW() + INTERVAL 10 MINUTE " +
                    "WHERE room_id = ? AND stay_date >= ? AND stay_date < ?",
                    bid, roomId, Date.valueOf(baseCheckIn), Date.valueOf(baseCheckOut)
            );
        }

        // GET /api/hotels/1 with dates must return 200 with availableRooms: 0
        mockMvc.perform(get("/api/hotels/1")
                        .param("checkIn", baseCheckIn.toString())
                        .param("checkOut", baseCheckOut.toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", equalTo(1)))
                .andExpect(jsonPath("$.availableRooms", equalTo(0)))
                .andExpect(jsonPath("$.nights", equalTo(3)))
                .andExpect(jsonPath("$.totalAmount", notNullValue()));
    }

    @Test
    @DisplayName("SRC-08: Unknown hotel ID returns 404 NOT_FOUND")
    void testUnknownHotelReturns404() throws Exception {
        mockMvc.perform(get("/api/hotels/99999")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", equalTo(404)))
                .andExpect(jsonPath("$.code", equalTo("NOT_FOUND")))
                .andExpect(jsonPath("$.message", notNullValue()))
                .andExpect(jsonPath("$.fieldErrors", empty()))
                .andExpect(jsonPath("$.timestamp", notNullValue()));
    }

    @Test
    @DisplayName("API Contract: Exactly one date supplied returns 400 VALIDATION_ERROR")
    void testOneDateOnlyReturns400() throws Exception {
        mockMvc.perform(get("/api/hotels")
                        .param("checkIn", baseCheckIn.toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", equalTo(400)))
                .andExpect(jsonPath("$.code", equalTo("VALIDATION_ERROR")))
                .andExpect(jsonPath("$.fieldErrors", hasSize(greaterThanOrEqualTo(1))));

        mockMvc.perform(get("/api/hotels/1")
                        .param("checkOut", baseCheckOut.toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", equalTo(400)))
                .andExpect(jsonPath("$.code", equalTo("VALIDATION_ERROR")))
                .andExpect(jsonPath("$.fieldErrors", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("API Contract: Invalid stay dates return 400 VALIDATION_ERROR")
    void testInvalidStayDatesReturn400() throws Exception {
        // checkOut before checkIn
        mockMvc.perform(get("/api/hotels")
                        .param("checkIn", baseCheckOut.toString())
                        .param("checkOut", baseCheckIn.toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", equalTo(400)))
                .andExpect(jsonPath("$.code", equalTo("VALIDATION_ERROR")))
                .andExpect(jsonPath("$.fieldErrors", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("API Contract: Multiple gallery images returned for hotel")
    void testMultipleGalleryImagesReturned() throws Exception {
        mockMvc.perform(get("/api/hotels/1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", equalTo(1)))
                .andExpect(jsonPath("$.images", hasSize(3)))
                .andExpect(jsonPath("$.images[0]", notNullValue()));
    }
}
