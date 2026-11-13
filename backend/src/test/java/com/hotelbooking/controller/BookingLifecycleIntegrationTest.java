package com.hotelbooking.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelbooking.dto.EmailVerificationRequest;
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
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookingLifecycleIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final LocalDate checkIn = LocalDate.now().plusDays(20);
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

    private String createHeldBooking(String guestName, String guestEmail) throws Exception {
        ReserveBookingRequest request = new ReserveBookingRequest(
                1L,
                checkIn,
                checkOut,
                guestName,
                guestEmail
        );
        MvcResult result = mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        return com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.reference");
    }

    // --- Confirm Tests (CNF-01..05) ---

    @Test
    @DisplayName("CNF-01: Confirm HELD booking transitions to CONFIRMED, sets nights to BOOKED, clears reserved_until, omits expiresAt")
    void testConfirmSuccess() throws Exception {
        String ref = createHeldBooking("Bob Builder", "bob@builder.io");

        EmailVerificationRequest verify = new EmailVerificationRequest("bob@builder.io");
        mockMvc.perform(post("/api/bookings/" + ref + "/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reference", equalTo(ref)))
                .andExpect(jsonPath("$.status", equalTo("CONFIRMED")))
                .andExpect(jsonPath("$.expiresAt").doesNotExist());

        // Verify DB state
        String bookingStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM booking WHERE reference = ?",
                String.class,
                ref
        );
        assertThat(bookingStatus).isEqualTo("CONFIRMED");

        Long bookingId = jdbcTemplate.queryForObject("SELECT id FROM booking WHERE reference = ?", Long.class, ref);
        Integer bookedNights = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE booking_id = ? AND status = 'BOOKED' AND reserved_until IS NULL",
                Integer.class,
                bookingId
        );
        assertThat(bookedNights).isEqualTo(3);
    }

    @Test
    @DisplayName("CNF-02: Confirm already CONFIRMED booking is idempotent returning 200 with same object")
    void testConfirmIdempotent() throws Exception {
        String ref = createHeldBooking("Bob Builder", "bob@builder.io");
        EmailVerificationRequest verify = new EmailVerificationRequest("bob@builder.io");

        // First confirm
        mockMvc.perform(post("/api/bookings/" + ref + "/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", equalTo("CONFIRMED")));

        // Second confirm (idempotent)
        mockMvc.perform(post("/api/bookings/" + ref + "/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", equalTo("CONFIRMED")));
    }

    @Test
    @DisplayName("CNF-03: Unknown reference OR wrong email returns identical 404 NOT_FOUND")
    void testConfirmWrongEmailOrReferenceReturns404() throws Exception {
        String ref = createHeldBooking("Bob Builder", "bob@builder.io");

        // Wrong email
        EmailVerificationRequest wrongEmail = new EmailVerificationRequest("wrong@email.io");
        MvcResult res1 = mockMvc.perform(post("/api/bookings/" + ref + "/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongEmail)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", equalTo(404)))
                .andExpect(jsonPath("$.code", equalTo("NOT_FOUND")))
                .andExpect(jsonPath("$.fieldErrors", empty()))
                .andReturn();

        // Unknown reference
        EmailVerificationRequest anyEmail = new EmailVerificationRequest("bob@builder.io");
        MvcResult res2 = mockMvc.perform(post("/api/bookings/HB-NONEXIST/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(anyEmail)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", equalTo(404)))
                .andExpect(jsonPath("$.code", equalTo("NOT_FOUND")))
                .andExpect(jsonPath("$.fieldErrors", empty()))
                .andReturn();

        // Ensure error format is identical
        String code1 = com.jayway.jsonpath.JsonPath.read(res1.getResponse().getContentAsString(), "$.code");
        String code2 = com.jayway.jsonpath.JsonPath.read(res2.getResponse().getContentAsString(), "$.code");
        assertThat(code1).isEqualTo(code2);
    }

    @Test
    @DisplayName("CNF-04: Confirm after hold deadline returns 409 HOLD_EXPIRED")
    void testConfirmAfterDeadlineReturnsHoldExpired() throws Exception {
        String ref = createHeldBooking("Lapsed User", "lapsed@user.io");

        // Simulate hold expiration by moving reserved_until into the past
        Long bookingId = jdbcTemplate.queryForObject("SELECT id FROM booking WHERE reference = ?", Long.class, ref);
        jdbcTemplate.update(
                "UPDATE room_night SET reserved_until = NOW() - INTERVAL 1 MINUTE WHERE booking_id = ?",
                bookingId
        );

        EmailVerificationRequest verify = new EmailVerificationRequest("lapsed@user.io");
        mockMvc.perform(post("/api/bookings/" + ref + "/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", equalTo(409)))
                .andExpect(jsonPath("$.code", equalTo("HOLD_EXPIRED")))
                .andExpect(jsonPath("$.message", notNullValue()))
                .andExpect(jsonPath("$.fieldErrors", empty()));
    }

    @Test
    @DisplayName("CNF-05: Confirm CANCELLED or EXPIRED booking returns 409 INVALID_STATE")
    void testConfirmCancelledOrExpiredReturnsInvalidState() throws Exception {
        String ref = createHeldBooking("State User", "state@user.io");

        // Manually set status to EXPIRED
        jdbcTemplate.update("UPDATE booking SET status = 'EXPIRED' WHERE reference = ?", ref);

        EmailVerificationRequest verify = new EmailVerificationRequest("state@user.io");
        mockMvc.perform(post("/api/bookings/" + ref + "/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", equalTo(409)))
                .andExpect(jsonPath("$.code", equalTo("INVALID_STATE")))
                .andExpect(jsonPath("$.fieldErrors", empty()));
    }

    // --- Retrieve Tests (GET-01..03) ---

    @Test
    @DisplayName("GET-01: Retrieve by reference and email returns 200 with booking object")
    void testRetrieveBookingSuccess() throws Exception {
        String ref = createHeldBooking("Charlie Brown", "charlie@brown.io");

        mockMvc.perform(get("/api/bookings/" + ref)
                        .param("email", "charlie@brown.io")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reference", equalTo(ref)))
                .andExpect(jsonPath("$.guestName", equalTo("Charlie Brown")))
                .andExpect(jsonPath("$.guestEmail", equalTo("charlie@brown.io")));
    }

    @Test
    @DisplayName("GET-02: Wrong email returns 404 NOT_FOUND identical to unknown reference")
    void testRetrieveWrongEmailReturns404() throws Exception {
        String ref = createHeldBooking("Charlie Brown", "charlie@brown.io");

        mockMvc.perform(get("/api/bookings/" + ref)
                        .param("email", "wrong@email.io")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", equalTo(404)))
                .andExpect(jsonPath("$.code", equalTo("NOT_FOUND")));
    }

    @Test
    @DisplayName("GET-03: Email comparison is case-insensitive and whitespace tolerant")
    void testRetrieveEmailCaseWhitespaceTolerant() throws Exception {
        String ref = createHeldBooking("Charlie Brown", "charlie@brown.io");

        // Pass mixed-case and padded whitespace
        mockMvc.perform(get("/api/bookings/" + ref)
                        .param("email", "  CHARLIE@Brown.IO  ")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reference", equalTo(ref)))
                .andExpect(jsonPath("$.guestEmail", equalTo("charlie@brown.io")));
    }

    // --- Cancel Tests (CAN-01..06) ---

    @Test
    @DisplayName("CAN-01: Cancel HELD booking releases nights back to AVAILABLE and booking becomes CANCELLED")
    void testCancelHeldBookingReleasesNights() throws Exception {
        String ref = createHeldBooking("David Copperfield", "david@magic.io");
        Long bookingId = jdbcTemplate.queryForObject("SELECT id FROM booking WHERE reference = ?", Long.class, ref);

        EmailVerificationRequest verify = new EmailVerificationRequest("david@magic.io");
        mockMvc.perform(post("/api/bookings/" + ref + "/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", equalTo("CANCELLED")));

        // Verify booking status
        String status = jdbcTemplate.queryForObject("SELECT status FROM booking WHERE id = ?", String.class, bookingId);
        assertThat(status).isEqualTo("CANCELLED");

        // Verify nights are released
        Integer reservedCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM room_night WHERE booking_id = ?",
                Integer.class,
                bookingId
        );
        assertThat(reservedCount).isEqualTo(0);
    }

    @Test
    @DisplayName("CAN-02: Cancel CONFIRMED booking releases nights and search offers the room again")
    void testCancelConfirmedBookingReleasesNightsAndSearchReflects() throws Exception {
        String ref = createHeldBooking("Eve Polastri", "eve@mi6.io");
        EmailVerificationRequest verify = new EmailVerificationRequest("eve@mi6.io");

        // Confirm booking
        mockMvc.perform(post("/api/bookings/" + ref + "/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isOk());

        // Cancel booking
        mockMvc.perform(post("/api/bookings/" + ref + "/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", equalTo("CANCELLED")));

        // Search should now report all 6 rooms available in Hotel 1
        mockMvc.perform(get("/api/hotels")
                        .param("location", "Goa")
                        .param("checkIn", checkIn.toString())
                        .param("checkOut", checkOut.toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", equalTo(1)))
                .andExpect(jsonPath("$[0].availableRooms", equalTo(6)));
    }

    @Test
    @DisplayName("CAN-03: Cancel already CANCELLED booking is idempotent returning 200 with CANCELLED status")
    void testCancelIdempotent() throws Exception {
        String ref = createHeldBooking("Frank Miller", "frank@comics.io");
        EmailVerificationRequest verify = new EmailVerificationRequest("frank@comics.io");

        // First cancel
        mockMvc.perform(post("/api/bookings/" + ref + "/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", equalTo("CANCELLED")));

        // Second cancel
        mockMvc.perform(post("/api/bookings/" + ref + "/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", equalTo("CANCELLED")));
    }

    @Test
    @DisplayName("CAN-04: Cancel when check_in <= today returns 409 INVALID_STATE with clear message")
    void testCancelAfterStayStartedReturnsInvalidState() throws Exception {
        String ref = createHeldBooking("George Costanza", "george@vandelay.io");

        // Simulate stay has started by updating check_in to today
        jdbcTemplate.update(
                "UPDATE booking SET check_in = ? WHERE reference = ?",
                Date.valueOf(LocalDate.now()),
                ref
        );

        EmailVerificationRequest verify = new EmailVerificationRequest("george@vandelay.io");
        mockMvc.perform(post("/api/bookings/" + ref + "/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", equalTo(409)))
                .andExpect(jsonPath("$.code", equalTo("INVALID_STATE")))
                .andExpect(jsonPath("$.message", equalTo("Cannot cancel once the stay has started.")));
    }

    @Test
    @DisplayName("CAN-05: Cancel EXPIRED booking returns 409 INVALID_STATE")
    void testCancelExpiredReturnsInvalidState() throws Exception {
        String ref = createHeldBooking("Hannah Abbott", "hannah@hogwarts.io");

        jdbcTemplate.update("UPDATE booking SET status = 'EXPIRED' WHERE reference = ?", ref);

        EmailVerificationRequest verify = new EmailVerificationRequest("hannah@hogwarts.io");
        mockMvc.perform(post("/api/bookings/" + ref + "/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", equalTo(409)))
                .andExpect(jsonPath("$.code", equalTo("INVALID_STATE")));
    }

    @Test
    @DisplayName("CAN-06: Cancel with wrong email returns 404 NOT_FOUND")
    void testCancelWrongEmailReturns404() throws Exception {
        String ref = createHeldBooking("Ian Malcolm", "ian@chaos.io");

        EmailVerificationRequest wrong = new EmailVerificationRequest("wrong@chaos.io");
        mockMvc.perform(post("/api/bookings/" + ref + "/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrong)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", equalTo(404)))
                .andExpect(jsonPath("$.code", equalTo("NOT_FOUND")));
    }
}
