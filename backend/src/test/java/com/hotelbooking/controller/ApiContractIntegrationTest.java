package com.hotelbooking.controller;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelbooking.dto.EmailVerificationRequest;
import com.hotelbooking.dto.ReserveBookingRequest;
import com.hotelbooking.exception.ConcurrencyConflictException;
import com.hotelbooking.service.InventoryInitializer;
import com.hotelbooking.testutil.TestDatabaseBootstrap;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
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
import java.util.Iterator;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests verifying adherence to docs/02-api-contract.md and docs/05-test-plan.md:
 * API-01 through API-06.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiContractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private GlobalExceptionHandler globalExceptionHandler;

    private final LocalDate checkIn = LocalDate.now().plusDays(30);
    private final LocalDate checkOut = checkIn.plusDays(3);

    @BeforeAll
    static void initDb(@Autowired TestDatabaseBootstrap bootstrap,
                       @Autowired InventoryInitializer inventoryInitializer) {
        bootstrap.resetSchema();
        bootstrap.applySeed();
        inventoryInitializer.initializeInventory();
    }

    @AfterAll
    static void cleanDb(@Autowired TestDatabaseBootstrap bootstrap) {
        bootstrap.resetSchema();
        bootstrap.applySeed();
    }

    @BeforeEach
    void cleanBookings() {
        jdbcTemplate.update("UPDATE room_night SET status = 'AVAILABLE', booking_id = NULL, reserved_until = NULL WHERE booking_id IS NOT NULL");
        jdbcTemplate.update("DELETE FROM booking");
    }

    private void assertStandardErrorShape(String json, int expectedStatus, String expectedCode) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        assertThat(root.hasNonNull("timestamp")).isTrue();
        assertThat(root.get("status").asInt()).isEqualTo(expectedStatus);
        assertThat(root.get("code").asText()).isEqualTo(expectedCode);
        assertThat(root.hasNonNull("message")).isTrue();
        assertThat(root.has("fieldErrors")).isTrue();
        assertThat(root.get("fieldErrors").isArray()).isTrue();

        // Exactly the 5 fields from docs/02 section 7
        Set<String> expectedFields = Set.of("timestamp", "status", "code", "message", "fieldErrors");
        Iterator<String> fieldNames = root.fieldNames();
        while (fieldNames.hasNext()) {
            assertThat(expectedFields).contains(fieldNames.next());
        }
    }

    private void assertNoStackTracesOrSql(String json) {
        String lower = json.toLowerCase();
        assertThat(lower).doesNotContain("exception");
        assertThat(lower).doesNotContain("sqlexception");
        assertThat(lower).doesNotContain("hibernate");
        assertThat(lower).doesNotContain("com.hotelbooking");
        assertThat(lower).doesNotContain("org.springframework");
        assertThat(lower).doesNotContain("at com.");
        assertThat(lower).doesNotContain("select ");
        assertThat(lower).doesNotContain("update ");
        assertThat(lower).doesNotContain("insert ");
        assertThat(lower).doesNotContain("delete ");
    }

    @Test
    @DisplayName("API-01 & API-04: VALIDATION_ERROR (400) conforms to Section 7 and leaks no internals")
    void testValidationErrorContract() throws Exception {
        ReserveBookingRequest invalidRequest = new ReserveBookingRequest(
                1L,
                checkIn,
                checkIn, // checkOut == checkIn
                "Alice",
                "alice@example.com"
        );

        MvcResult result = mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertStandardErrorShape(body, 400, "VALIDATION_ERROR");
        assertNoStackTracesOrSql(body);

        JsonNode root = objectMapper.readTree(body);
        assertThat(root.get("fieldErrors")).isNotEmpty();
        JsonNode firstError = root.get("fieldErrors").get(0);
        assertThat(firstError.hasNonNull("field")).isTrue();
        assertThat(firstError.hasNonNull("message")).isTrue();
    }

    @Test
    @DisplayName("API-01 & API-04: NOT_FOUND (404) conforms to Section 7 and leaks no internals")
    void testNotFoundErrorContract() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/hotels/99999"))
                .andExpect(status().isNotFound())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertStandardErrorShape(body, 404, "NOT_FOUND");
        assertNoStackTracesOrSql(body);
    }

    @Test
    @DisplayName("API-01 & API-04: SOLD_OUT (409) conforms to Section 7 and leaks no internals")
    void testSoldOutErrorContract() throws Exception {
        // Hold all rooms of Hotel 1
        var roomIds = jdbcTemplate.queryForList("SELECT id FROM room WHERE hotel_id = 1", Long.class);
        for (int i = 0; i < roomIds.size(); i++) {
            Long rid = roomIds.get(i);
            String ref = "HB-SLD" + i;
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

        ReserveBookingRequest req = new ReserveBookingRequest(1L, checkIn, checkOut, "Guest", "g@test.io");
        MvcResult result = mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertStandardErrorShape(body, 409, "SOLD_OUT");
        assertNoStackTracesOrSql(body);
    }

    @Test
    @DisplayName("API-01 & API-04: HOLD_EXPIRED (409) conforms to Section 7 and leaks no internals")
    void testHoldExpiredErrorContract() throws Exception {
        jdbcTemplate.update(
                "INSERT INTO booking (reference, hotel_id, room_id, guest_name, guest_email, check_in, check_out, nights, price_per_night, total_amount, status, expires_at) " +
                "VALUES ('HB-EXP99', 1, 1, 'Exp Guest', 'exp@test.io', ?, ?, 3, 4000.00, 12000.00, 'HELD', NOW() - INTERVAL 5 MINUTE)",
                Date.valueOf(checkIn), Date.valueOf(checkOut)
        );

        EmailVerificationRequest req = new EmailVerificationRequest("exp@test.io");
        MvcResult result = mockMvc.perform(post("/api/bookings/HB-EXP99/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertStandardErrorShape(body, 409, "HOLD_EXPIRED");
        assertNoStackTracesOrSql(body);
    }

    @Test
    @DisplayName("API-01 & API-04: INVALID_STATE (409) conforms to Section 7 and leaks no internals")
    void testInvalidStateErrorContract() throws Exception {
        jdbcTemplate.update(
                "INSERT INTO booking (reference, hotel_id, room_id, guest_name, guest_email, check_in, check_out, nights, price_per_night, total_amount, status, expires_at) " +
                "VALUES ('HB-EXP88', 1, 1, 'Exp Guest', 'exp@test.io', ?, ?, 3, 4000.00, 12000.00, 'EXPIRED', NOW() - INTERVAL 5 MINUTE)",
                Date.valueOf(checkIn), Date.valueOf(checkOut)
        );

        EmailVerificationRequest req = new EmailVerificationRequest("exp@test.io");
        MvcResult result = mockMvc.perform(post("/api/bookings/HB-EXP88/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertStandardErrorShape(body, 409, "INVALID_STATE");
        assertNoStackTracesOrSql(body);
    }

    @Test
    @DisplayName("API-01 & API-04: CONCURRENCY_CONFLICT (409) conforms to Section 7 and leaks no internals")
    void testConcurrencyConflictErrorContract() throws Exception {
        var resp = globalExceptionHandler.handleConcurrencyConflict(new ConcurrencyConflictException("Lock conflict occurred"));
        assertThat(resp.getStatusCode().value()).isEqualTo(409);
        String body = objectMapper.writeValueAsString(resp.getBody());
        assertStandardErrorShape(body, 409, "CONCURRENCY_CONFLICT");
        assertNoStackTracesOrSql(body);
    }

    @Test
    @DisplayName("API-01 & API-04: INTERNAL_ERROR (500) masks unexpected details completely")
    void testInternalErrorContract() throws Exception {
        var resp = globalExceptionHandler.handleGenericException(new RuntimeException("Sensitive database stacktrace with SELECT * FROM user"));
        assertThat(resp.getStatusCode().value()).isEqualTo(500);
        String body = objectMapper.writeValueAsString(resp.getBody());
        assertStandardErrorShape(body, 500, "INTERNAL_ERROR");
        assertNoStackTracesOrSql(body);
        assertThat(body).contains("An unexpected internal error occurred.");
    }

    @Test
    @DisplayName("API-02: Malformed JSON -> 400 VALIDATION_ERROR with proper Section 7 body")
    void testMalformedJsonReturnsValidationError() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"hotelId\": 1, invalid_json: true }"))
                .andExpect(status().isBadRequest())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertStandardErrorShape(body, 400, "VALIDATION_ERROR");
        assertNoStackTracesOrSql(body);
    }

    @Test
    @DisplayName("API-03: Unknown route -> 404 NOT_FOUND with Section 7 body")
    void testUnknownRouteReturnsNotFound() throws Exception {
        // Unknown GET route
        MvcResult getResult = mockMvc.perform(get("/api/nonexistent-route"))
                .andExpect(status().isNotFound())
                .andReturn();

        String getBody = getResult.getResponse().getContentAsString();
        assertStandardErrorShape(getBody, 404, "NOT_FOUND");
        assertNoStackTracesOrSql(getBody);

        // Unknown POST route
        MvcResult postResult = mockMvc.perform(post("/api/unknown-endpoint")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound())
                .andReturn();

        String postBody = postResult.getResponse().getContentAsString();
        assertStandardErrorShape(postBody, 404, "NOT_FOUND");
        assertNoStackTracesOrSql(postBody);
    }

    @Test
    @DisplayName("API-05: JSON field names strictly match docs/02 across browse, search, and reserve")
    void testJsonFieldNamesStrictlyMatchContract() throws Exception {
        // 1. Browse hotels
        MvcResult browseResult = mockMvc.perform(get("/api/hotels"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode browseArray = objectMapper.readTree(browseResult.getResponse().getContentAsString());
        assertThat(browseArray.isArray()).isTrue();
        assertThat(browseArray.size()).isGreaterThan(0);

        Set<String> browseExpectedFields = Set.of(
                "id", "name", "location", "address", "description", "imageUrl", "amenities", "pricePerNight"
        );
        for (JsonNode hotelNode : browseArray) {
            Iterator<String> fields = hotelNode.fieldNames();
            while (fields.hasNext()) {
                assertThat(browseExpectedFields).contains(fields.next());
            }
        }

        // 2. Search hotels with dates
        MvcResult searchResult = mockMvc.perform(get("/api/hotels")
                        .param("checkIn", checkIn.toString())
                        .param("checkOut", checkOut.toString()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode searchArray = objectMapper.readTree(searchResult.getResponse().getContentAsString());
        assertThat(searchArray.isArray()).isTrue();
        Set<String> searchExpectedFields = Set.of(
                "id", "name", "location", "address", "description", "imageUrl", "amenities", "pricePerNight",
                "availableRooms", "nights", "totalAmount"
        );
        for (JsonNode hotelNode : searchArray) {
            Iterator<String> fields = hotelNode.fieldNames();
            while (fields.hasNext()) {
                assertThat(searchExpectedFields).contains(fields.next());
            }
        }

        // 3. Reserve booking
        ReserveBookingRequest reserveRequest = new ReserveBookingRequest(
                1L,
                checkIn,
                checkOut,
                "API Five Guest",
                "apifive@test.io"
        );
        MvcResult reserveResult = mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reserveRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode bookingNode = objectMapper.readTree(reserveResult.getResponse().getContentAsString());
        Set<String> bookingExpectedFields = Set.of(
                "reference", "status", "hotelId", "hotelName", "roomNumber",
                "guestName", "guestEmail", "checkIn", "checkOut", "nights",
                "pricePerNight", "totalAmount", "expiresAt", "createdAt"
        );
        Iterator<String> bookingFields = bookingNode.fieldNames();
        while (bookingFields.hasNext()) {
            assertThat(bookingExpectedFields).contains(bookingFields.next());
        }
    }

    @Test
    @DisplayName("API-06: Guest emails are never written to application logs during operations")
    void testEmailsNotLogged() throws Exception {
        Logger rootLogger = (Logger) LoggerFactory.getLogger("com.hotelbooking");
        ListAppender<ILoggingEvent> listAppender = new ListAppender<>();
        listAppender.start();
        rootLogger.addAppender(listAppender);

        String secretEmail = "secret-guest-api06@privacy.org";

        try {
            // 1. Reserve
            ReserveBookingRequest req = new ReserveBookingRequest(1L, checkIn, checkOut, "Secret Guest", secretEmail);
            MvcResult res = mockMvc.perform(post("/api/bookings")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated())
                    .andReturn();

            String ref = com.jayway.jsonpath.JsonPath.read(res.getResponse().getContentAsString(), "$.reference");

            // 2. Retrieve
            mockMvc.perform(get("/api/bookings/" + ref).param("email", secretEmail))
                    .andExpect(status().isOk());

            // 3. Confirm
            mockMvc.perform(post("/api/bookings/" + ref + "/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new EmailVerificationRequest(secretEmail))))
                    .andExpect(status().isOk());

            // 4. Cancel
            mockMvc.perform(post("/api/bookings/" + ref + "/cancel")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new EmailVerificationRequest(secretEmail))))
                    .andExpect(status().isOk());

            // Assert that the email was NEVER logged
            for (ILoggingEvent event : listAppender.list) {
                String msg = event.getFormattedMessage();
                assertThat(msg).doesNotContain(secretEmail);
                if (event.getArgumentArray() != null) {
                    for (Object arg : event.getArgumentArray()) {
                        if (arg != null) {
                            assertThat(arg.toString()).doesNotContain(secretEmail);
                        }
                    }
                }
            }
        } finally {
            rootLogger.detachAppender(listAppender);
        }
    }
}
