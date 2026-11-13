package com.hotelbooking.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelbooking.domain.BookingStatus;
import com.hotelbooking.domain.RoomNightStatus;
import com.hotelbooking.dto.ReserveBookingRequest;
import com.hotelbooking.service.InventoryInitializer;
import com.hotelbooking.testutil.TestDatabaseBootstrap;
import org.junit.jupiter.api.AfterAll;
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
import org.springframework.test.web.servlet.MvcResult;

import java.sql.Date;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReserveIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final LocalDate checkIn = LocalDate.now().plusDays(15);
    private final LocalDate checkOut = checkIn.plusDays(3); // 3 nights

    @BeforeAll
    static void initDatabase(
            @Autowired TestDatabaseBootstrap bootstrap,
            @Autowired InventoryInitializer inventoryInitializer) {
        bootstrap.resetSchema();
        bootstrap.applySeed();
        inventoryInitializer.initializeInventory();
    }

    @BeforeEach
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

    @Test
    @DisplayName("RES-01: Successful reserve creates HELD booking, RESERVED nights, and returns 201 with Location header")
    void testReserveSuccess() throws Exception {
        ReserveBookingRequest request = new ReserveBookingRequest(
                1L,
                checkIn,
                checkOut,
                "  Alice Smith  ",
                "Alice.Smith@Domain.COM"
        );

        MvcResult result = mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", matchesPattern("^/api/bookings/HB-[A-Z0-9]{6}$")))
                .andExpect(jsonPath("$.reference", matchesPattern("^HB-[A-Z0-9]{6}$")))
                .andExpect(jsonPath("$.status", equalTo("HELD")))
                .andExpect(jsonPath("$.hotelId", equalTo(1)))
                .andExpect(jsonPath("$.hotelName", notNullValue()))
                .andExpect(jsonPath("$.roomNumber", notNullValue()))
                .andExpect(jsonPath("$.guestName", equalTo("Alice Smith")))
                .andExpect(jsonPath("$.guestEmail", equalTo("alice.smith@domain.com")))
                .andExpect(jsonPath("$.checkIn", equalTo(checkIn.toString())))
                .andExpect(jsonPath("$.checkOut", equalTo(checkOut.toString())))
                .andExpect(jsonPath("$.nights", equalTo(3)))
                .andExpect(jsonPath("$.pricePerNight", equalTo(4500.00)))
                .andExpect(jsonPath("$.totalAmount", equalTo(13500.00)))
                .andExpect(jsonPath("$.expiresAt", notNullValue()))
                .andExpect(jsonPath("$.createdAt", notNullValue()))
                .andReturn();

        String ref = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.reference");

        // Verify DB booking state
        Integer bookingCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM booking WHERE reference = ? AND status = 'HELD'",
                Integer.class,
                ref
        );
        assertThat(bookingCount).isEqualTo(1);

        Long bookingId = jdbcTemplate.queryForObject(
                "SELECT id FROM booking WHERE reference = ?",
                Long.class,
                ref
        );

        // Verify exactly 3 room_nights are RESERVED for this booking
        Integer nightsCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE booking_id = ? AND status = 'RESERVED' AND reserved_until > NOW()",
                Integer.class,
                bookingId
        );
        assertThat(nightsCount).isEqualTo(3);
    }

    @Test
    @DisplayName("RES-02: Sold out returns 409 SOLD_OUT, creates NO booking row, leaves NO reserved nights")
    void testReserveSoldOutRollback() throws Exception {
        // Hold all 6 rooms of Hotel 1 for the range
        var roomIds = jdbcTemplate.queryForList("SELECT id FROM room WHERE hotel_id = 1", Long.class);
        for (int i = 0; i < roomIds.size(); i++) {
            Long rid = roomIds.get(i);
            String ref = "HB-SOLDO" + i;
            jdbcTemplate.update(
                    "INSERT INTO booking (reference, hotel_id, room_id, guest_name, guest_email, check_in, check_out, nights, price_per_night, total_amount, status, expires_at) " +
                    "VALUES (?, 1, ?, 'Holder', 'h@test.io', ?, ?, 3, 4000.00, 12000.00, 'HELD', NOW() + INTERVAL 10 MINUTE)",
                    ref, rid, Date.valueOf(checkIn), Date.valueOf(checkOut)
            );
            Long bid = jdbcTemplate.queryForObject("SELECT id FROM booking WHERE reference = ?", Long.class, ref);
            jdbcTemplate.update(
                    "UPDATE room_night SET status = 'RESERVED', booking_id = ?, reserved_until = NOW() + INTERVAL 10 MINUTE " +
                    "WHERE room_id = ? AND stay_date >= ? AND stay_date < ?",
                    bid, rid, Date.valueOf(checkIn), Date.valueOf(checkOut)
            );
        }

        int bookingsBefore = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM booking", Integer.class);

        // Attempt new reservation
        ReserveBookingRequest request = new ReserveBookingRequest(
                1L,
                checkIn,
                checkOut,
                "Extra Guest",
                "extra@guest.io"
        );

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", equalTo(409)))
                .andExpect(jsonPath("$.code", equalTo("SOLD_OUT")))
                .andExpect(jsonPath("$.message", notNullValue()))
                .andExpect(jsonPath("$.fieldErrors", empty()));

        int bookingsAfter = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM booking", Integer.class);
        assertThat(bookingsAfter).isEqualTo(bookingsBefore);
    }

    @Test
    @DisplayName("RES-03: Fallback when candidate 1 partially taken -> candidate 2 claimed")
    void testReserveCandidateFallback() throws Exception {
        var roomIds = jdbcTemplate.queryForList("SELECT id FROM room WHERE hotel_id = 1 ORDER BY id ASC", Long.class);
        Long candidate1 = roomIds.get(0);
        Long candidate2 = roomIds.get(1);

        // Mark middle night of candidate1 as already reserved
        jdbcTemplate.update(
                "INSERT INTO booking (reference, hotel_id, room_id, guest_name, guest_email, check_in, check_out, nights, price_per_night, total_amount, status, expires_at) " +
                "VALUES ('HB-BLOCK1', 1, ?, 'Blocker', 'b@test.io', ?, ?, 1, 4000.00, 4000.00, 'HELD', NOW() + INTERVAL 10 MINUTE)",
                candidate1, Date.valueOf(checkIn.plusDays(1)), Date.valueOf(checkIn.plusDays(2))
        );
        Long blockBid = jdbcTemplate.queryForObject("SELECT id FROM booking WHERE reference = 'HB-BLOCK1'", Long.class);
        jdbcTemplate.update(
                "UPDATE room_night SET status = 'RESERVED', booking_id = ?, reserved_until = NOW() + INTERVAL 10 MINUTE " +
                "WHERE room_id = ? AND stay_date = ?",
                blockBid, candidate1, Date.valueOf(checkIn.plusDays(1))
        );

        ReserveBookingRequest request = new ReserveBookingRequest(
                1L,
                checkIn,
                checkOut,
                "Fallback User",
                "fallback@user.io"
        );

        MvcResult result = mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", equalTo("HELD")))
                .andReturn();

        String ref = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.reference");
        Long actualRoomId = jdbcTemplate.queryForObject("SELECT room_id FROM booking WHERE reference = ?", Long.class, ref);

        // Candidate 2 should be claimed, not candidate 1
        assertThat(actualRoomId).isEqualTo(candidate2);

        // Verify candidate 2 nights are claimed
        Long actualBookingId = jdbcTemplate.queryForObject("SELECT id FROM booking WHERE reference = ?", Long.class, ref);
        Integer claimedNights = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE booking_id = ? AND room_id = ? AND status = 'RESERVED'",
                Integer.class,
                actualBookingId,
                candidate2
        );
        assertThat(claimedNights).isEqualTo(3);
    }

    @Test
    @DisplayName("RES-04: Invalid inputs return 400 VALIDATION_ERROR with structured field errors")
    void testReserveInvalidInputs() throws Exception {
        // Past check-in
        ReserveBookingRequest pastCheckIn = new ReserveBookingRequest(
                1L,
                LocalDate.now().minusDays(1),
                LocalDate.now().plusDays(2),
                "Valid Name",
                "valid@test.io"
        );
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pastCheckIn)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", equalTo("VALIDATION_ERROR")))
                .andExpect(jsonPath("$.fieldErrors", hasSize(greaterThanOrEqualTo(1))));

        // check-out <= check-in
        ReserveBookingRequest badOrder = new ReserveBookingRequest(
                1L,
                checkIn,
                checkIn,
                "Valid Name",
                "valid@test.io"
        );
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badOrder)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", equalTo("VALIDATION_ERROR")));

        // Blank name
        ReserveBookingRequest blankName = new ReserveBookingRequest(
                1L,
                checkIn,
                checkOut,
                "   ",
                "valid@test.io"
        );
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankName)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", equalTo("VALIDATION_ERROR")));

        // Malformed email
        ReserveBookingRequest badEmail = new ReserveBookingRequest(
                1L,
                checkIn,
                checkOut,
                "Valid Name",
                "notanemail"
        );
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badEmail)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", equalTo("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("RES-05: Unknown hotel ID returns 404 NOT_FOUND")
    void testReserveUnknownHotel() throws Exception {
        ReserveBookingRequest request = new ReserveBookingRequest(
                99999L,
                checkIn,
                checkOut,
                "Valid Name",
                "valid@test.io"
        );
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", equalTo(404)))
                .andExpect(jsonPath("$.code", equalTo("NOT_FOUND")))
                .andExpect(jsonPath("$.fieldErrors", empty()));
    }
}
