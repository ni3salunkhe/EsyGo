# Hotel Booking System — Backend Discovery & Frontend Integration Report

**Target Document:** `docs/frontend/backend-discovery-report.md`  
**Generated Date:** 2026-11-13  
**Auditor / Agent:** Antigravity (Google DeepMind)  
**Verification Standard:** Evidence-based, source-code & database verified. Zero assumptions.  
**Classification Tags:**
- **`[VERIFIED]`**: Directly confirmed from current source code, configuration, or test runs in this session.
- **`[HISTORICAL]`**: Documented in earlier commits/audits; confirmed against historical artifacts.
- **`[DISCREPANCY]`**: Confirmed divergence between historical documentation/audits and actual code.
- **`[UNKNOWN]`**: Outside current repository visibility or requiring runtime confirmation.

---

## 1. Executive Summary

A comprehensive, read-only technical discovery of the **Hotel Booking System** backend was performed to prepare for frontend design and implementation. The backend is implemented in Java 17 using Spring Boot 3.4.4, Spring Data JPA, and MySQL 8.0.46, built via Maven 3.9.9.

### Key Discoveries & Architectural Reality
1. **Absolute Read-Only Boundary:** The backend implementation is strictly frozen as the integration contract. All frontend interfaces, state machines, and workflows must adapt to the backend as-is.
2. **Current State:** The repository is on branch `main` at commit `07b6a0b` (tagged through `step-09`). The backend test suite contains **98 automated tests** (unit, integration, and high-concurrency stress tests) which have demonstrated 10 consecutive clean test passes.
3. **Audit Finding F-01 Status:** Historical audit `AUDIT-20261113-1` reported finding `F-01` (mutation test survival in partial claim reversion). Code inspection of commit `58c2b93` confirms that `ReserveIntegrationTest#testReserveCandidateFallback` was strengthened with explicit candidate 1 rollback assertions, killing mutation M5.
4. **Endpoint Path Discrepancy Identified:** Historical audit text loosely referenced `POST /bookings/reserve`. Current production source code ([BookingController.java#L32-L37](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/controller/BookingController.java#L32-L37)) explicitly maps the reservation hold creation to **`POST /api/bookings`**. Calling `/api/bookings/reserve` returns HTTP 404.
5. **CORS is Unconfigured:** Zero CORS annotations (`@CrossOrigin`) or filter beans exist in `backend/src/main/java`. Direct browser cross-origin requests from frontend dev servers (e.g., `localhost:3000` or `localhost:5173`) to `localhost:8080` will be blocked by browser Same-Origin Policy (SOP). The frontend development environment **must** configure a local dev-server reverse proxy (e.g. Vite `/api` proxy or Next.js rewrites) to forward requests to `http://localhost:8080`.
6. **Stateless Guest Identity:** The application has no authentication, JWTs, or user sessions. Guest authorization for viewing or cancelling a booking relies entirely on matching the 9-character reference (`HB-XXXXXX`) and the guest's normalized email.

---

## 2. Current Repository and Environment

| Environment Attribute | Value | Verification Status | Source Reference |
|---|---|---|---|
| **Root Directory** | `E:\hotel_booking` | `[VERIFIED]` | Local filesystem check |
| **Git Branch** | `main` | `[VERIFIED]` | `git status` -> `On branch main` |
| **HEAD Commit** | `07b6a0b` | `[VERIFIED]` | `git rev-parse HEAD` |
| **Latest Commit Subject** | `docs: complete README assumptions, surprise feature write-up, and traceability` | `[VERIFIED]` | `git log -n 1 --oneline` |
| **Git Working Tree** | Clean tracked files; untracked file `audits/AUDIT-20261113-2.md` | `[VERIFIED]` | `git status` |
| **Existing Tags** | `step-01`, `step-02`, `step-03`, `step-04`, `step-05`, `step-06`, `step-07`, `step-08`, `step-09` | `[VERIFIED]` | `git tag -l` |
| **Existing Frontend** | None exists (directory `frontend/` not yet created) | `[VERIFIED]` | `Get-ChildItem -Directory` |
| **Backend Directory** | `backend/` | `[VERIFIED]` | Directory listing |
| **Backend Entry Point** | `com.hotelbooking.HotelBookingApplication` | `[VERIFIED]` | [HotelBookingApplication.java#L6-L12](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/HotelBookingApplication.java#L6-L12) |
| **Java Version** | Java 17 LTS (Eclipse Temurin 17.0.13+11) | `[VERIFIED]` | `java -version` |
| **Spring Boot Version** | `3.4.4` | `[VERIFIED]` | [pom.xml#L10](file:///e:/hotel_booking/backend/pom.xml#L10) |
| **Build Tool** | Apache Maven 3.9.9 | `[VERIFIED]` | `mvn -v` / [pom.xml](file:///e:/hotel_booking/backend/pom.xml) |
| **Database Server** | MySQL Community Server 8.0.46 on port 3306 | `[VERIFIED]` | `mysql --version`, [DECISIONS.md#L25](file:///e:/hotel_booking/docs/DECISIONS.md#L25) |
| **Runtime Port** | `8080` (Spring Boot default, unconfigured in properties) | `[VERIFIED]` | [application.properties](file:///e:/hotel_booking/backend/src/main/resources/application.properties) |
| **Context Path** | `/` (root; controllers declare `/api/hotels`, `/api/bookings`) | `[VERIFIED]` | [HotelController.java#L20](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/controller/HotelController.java#L20), [BookingController.java#L19](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/controller/BookingController.java#L19) |
| **Primary Dependencies** | `spring-boot-starter-web`, `spring-boot-starter-validation`, `spring-boot-starter-data-jpa`, `mysql-connector-j` | `[VERIFIED]` | [pom.xml#L28-L47](file:///e:/hotel_booking/backend/pom.xml#L28-L47) |
| **Configuration File** | `backend/src/main/resources/application.properties` | `[VERIFIED]` | [application.properties](file:///e:/hotel_booking/backend/src/main/resources/application.properties) |
| **Environment Variables** | Sourced from `.env`: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `TEST_DB_URL`, `TEST_DB_USERNAME`, `TEST_DB_PASSWORD` | `[VERIFIED]` | `.env`, [.env.example](file:///e:/hotel_booking/.env.example) |

---

## 3. Actual Database Schema and Relationships

Authoritative DDL: [db/schema.sql](file:///e:/hotel_booking/db/schema.sql) (frozen by design). Entities validate against Hibernate via `spring.jpa.hibernate.ddl-auto=validate`.

```
       ┌────────────────────────┐                   ┌────────────────────────┐
       │         hotel          │                   │        amenity         │
       ├────────────────────────┤                   ├────────────────────────┤
       │ PK  id BIGINT          │                   │ PK  id INT             │
       │     name VARCHAR(100)  │                   │     name VARCHAR(40)UQ │
       │     location VARCHAR(50│                   └───────────┬────────────┘
       │     price_per_night    │                               │
       └───────────┬────────────┘                               │
                   │ 1                                          │ *
                   │                                ┌───────────┴────────────┐
                   ├───────────────────────────────►│     hotel_amenity      │
                   │                                ├────────────────────────┤
                   │ 1                              │ PK,FK hotel_id BIGINT  │
                   │                                │ PK,FK amenity_id INT   │
                   ▼ *                              └────────────────────────┘
       ┌────────────────────────┐
       │          room          │
       ├────────────────────────┤
       │ PK  id BIGINT          │
       │ FK  hotel_id BIGINT    │
       │     room_number VARCHAR│
       └───────────┬────────────┘
                   │ 1
                   │
                   │ * 
                   ▼ 
       ┌────────────────────────┐                   ┌────────────────────────┐
       │       room_night       │                   │        booking         │
       ├────────────────────────┤                   ├────────────────────────┤
       │ PK,FK room_id BIGINT   │◄─────────────────┤ FK  room_id BIGINT     │
       │ PK    stay_date DATE   │   holds nights    │ PK  id BIGINT          │
       │       status VARCHAR   │                   │     reference VARCHARUQ│
       │ FK    booking_id BIGINT│──────────────────►│ FK  hotel_id BIGINT    │
       │       reserved_until   │                   │     status VARCHAR     │
       └────────────────────────┘                   │     expires_at TIME    │
                                                    └────────────────────────┘
```

### Table Definitions `[VERIFIED]`

1. **`hotel`** ([schema.sql#L9-L19](file:///e:/hotel_booking/db/schema.sql#L9-L19))
   - `id`: BIGINT AUTO_INCREMENT, Primary Key
   - `name`: VARCHAR(100) NOT NULL
   - `location`: VARCHAR(50) NOT NULL, Indexed (`idx_hotel_location`)
   - `address`: VARCHAR(255) NOT NULL
   - `description`: TEXT NULL
   - `image_url`: VARCHAR(255) NULL (Current seed strictly sets NULL per D-14)
   - `price_per_night`: DECIMAL(10,2) NOT NULL
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

2. **`amenity`** ([schema.sql#L21-L24](file:///e:/hotel_booking/db/schema.sql#L21-L24))
   - `id`: INT AUTO_INCREMENT, Primary Key
   - `name`: VARCHAR(40) NOT NULL UNIQUE

3. **`hotel_amenity`** ([schema.sql#L26-L32](file:///e:/hotel_booking/db/schema.sql#L26-L32))
   - `hotel_id`: BIGINT NOT NULL, FK -> `hotel(id)`
   - `amenity_id`: INT NOT NULL, FK -> `amenity(id)`
   - Composite Primary Key: `(hotel_id, amenity_id)`

4. **`room`** ([schema.sql#L34-L40](file:///e:/hotel_booking/db/schema.sql#L34-L40))
   - `id`: BIGINT AUTO_INCREMENT, Primary Key
   - `hotel_id`: BIGINT NOT NULL, FK -> `hotel(id)`
   - `room_number`: VARCHAR(10) NOT NULL
   - Unique Constraint: `UNIQUE (hotel_id, room_number)`
   - *Design note:* Does NOT store availability status. Availability is tracked purely in `room_night`.

5. **`booking`** ([schema.sql#L42-L60](file:///e:/hotel_booking/db/schema.sql#L42-L60))
   - `id`: BIGINT AUTO_INCREMENT, Primary Key
   - `reference`: VARCHAR(12) NOT NULL UNIQUE (Format: `HB-` + 6 uppercase chars/digits, e.g. `HB-7K3Q9X`)
   - `hotel_id`: BIGINT NOT NULL, FK -> `hotel(id)`
   - `room_id`: BIGINT NOT NULL, FK -> `room(id)`
   - `guest_name`: VARCHAR(100) NOT NULL
   - `guest_email`: VARCHAR(150) NOT NULL
   - `check_in`: DATE NOT NULL
   - `check_out`: DATE NOT NULL
   - `nights`: INT NOT NULL
   - `price_per_night`: DECIMAL(10,2) NOT NULL
   - `total_amount`: DECIMAL(10,2) NOT NULL
   - `status`: VARCHAR(10) NOT NULL (`HELD`, `CONFIRMED`, `CANCELLED`, `EXPIRED`)
   - `expires_at`: TIMESTAMP NULL (populated while `HELD`, cleared when `CONFIRMED`)
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - Check Constraint: `CHECK (check_out > check_in)`

6. **`room_night`** ([schema.sql#L62-L73](file:///e:/hotel_booking/db/schema.sql#L62-L73))
   - `room_id`: BIGINT NOT NULL, FK -> `room(id)`
   - `stay_date`: DATE NOT NULL
   - Composite Primary Key: `(room_id, stay_date)` — **enforces at database level that one physical room can belong to at most one booking per night**
   - `status`: VARCHAR(10) NOT NULL DEFAULT `'AVAILABLE'` (`AVAILABLE`, `RESERVED`, `BOOKED`)
   - `booking_id`: BIGINT NULL, FK -> `booking(id)`, Indexed (`idx_rn_booking`)
   - `reserved_until`: TIMESTAMP NULL, Indexed (`idx_rn_expiry` on `(status, reserved_until)`)

### Inventory Strategy & Seed Data `[VERIFIED]`
- **Seed Data ([db/seed.sql](file:///e:/hotel_booking/db/seed.sql)):** Contains 8 shared amenities, 5 hotels across 4 cities (Goa: 2 hotels, Mumbai: 1, Jaipur: 1, Bengaluru: 1), and 25 physical rooms total.
- **Inventory Seeding ([InventoryInitializer.java#L44-L89](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/service/InventoryInitializer.java#L44-L89)):** On application start, `InventoryStartupRunner` idempotently generates 365 days of `room_night` records for all 25 rooms ($25 \times 365 = 9,125$ rows) using `INSERT IGNORE INTO room_night (room_id, stay_date, status) VALUES (?, ?, 'AVAILABLE')`.

---

## 4. Complete API Contract

Base URL Path: `/api`  
Error format: Uniform error schema across all 4xx/5xx responses.

---

### Endpoint 1: Search & Browse Hotels `[VERIFIED]`
- **Route:** `GET /api/hotels`
- **Controller Method:** `HotelController#searchOrBrowse` ([HotelController.java#L34-L42](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/controller/HotelController.java#L34-L42))
- **Query Parameters:**
  - `location` (String, optional, case-insensitive exact match)
  - `checkIn` (ISO Date `yyyy-MM-dd`, optional)
  - `checkOut` (ISO Date `yyyy-MM-dd`, optional)
- **Modes & Business Rules:**
  - **Browse Mode (no dates supplied):** Returns all hotels matching `location` (or all hotels if location omitted), ordered by hotel name ASC. `availableRooms`, `nights`, and `totalAmount` are **OMITTED** (not null) from output JSON.
  - **Search Mode (BOTH dates supplied):** Filters to hotels that have $\ge 1$ room with every night in `[checkIn, checkOut)` marked `AVAILABLE`. Returns `availableRooms`, `nights`, and `totalAmount`. Hotels with 0 available rooms are excluded.
  - **Single Date Supplied:** Supplying only `checkIn` or only `checkOut` throws `ValidationException` $\rightarrow$ returns HTTP `400 VALIDATION_ERROR`.
- **Success Status:** `200 OK`
- **Response JSON (Browse Mode):**
```json
[
  {
    "id": 1,
    "name": "Azure Bay Resort",
    "location": "Goa",
    "address": "104 Calangute Beach Road, North Goa, 403516",
    "description": "A tranquil beachfront sanctuary offering panoramic Arabian Sea vistas, lush gardens, and direct private beach access.",
    "imageUrl": null,
    "amenities": [
      "Air Conditioning",
      "Complimentary Breakfast",
      "Free Parking",
      "Luxury Spa",
      "Multi-Cuisine Restaurant",
      "Swimming Pool",
      "Wi-Fi"
    ],
    "pricePerNight": 4500.00
  }
]
```
- **Response JSON (Search Mode with `checkIn=2026-12-10&checkOut=2026-12-12`):**
```json
[
  {
    "id": 1,
    "name": "Azure Bay Resort",
    "location": "Goa",
    "address": "104 Calangute Beach Road, North Goa, 403516",
    "description": "A tranquil beachfront sanctuary offering panoramic Arabian Sea vistas, lush gardens, and direct private beach access.",
    "imageUrl": null,
    "amenities": [
      "Air Conditioning",
      "Complimentary Breakfast",
      "Free Parking",
      "Luxury Spa",
      "Multi-Cuisine Restaurant",
      "Swimming Pool",
      "Wi-Fi"
    ],
    "pricePerNight": 4500.00,
    "availableRooms": 6,
    "nights": 2,
    "totalAmount": 9000.00
  }
]
```
- **Error Codes:** `400 VALIDATION_ERROR` (single date, invalid date format, past date, checkout $\le$ checkin, stay > 30 nights, search > 365 days).

---

### Endpoint 2: Hotel Details `[VERIFIED]`
- **Route:** `GET /api/hotels/{hotelId}`
- **Controller Method:** `HotelController#getHotelDetail` ([HotelController.java#L50-L58](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/controller/HotelController.java#L50-L58))
- **Path Parameters:** `hotelId` (Long, required)
- **Query Parameters:** `checkIn` (LocalDate, optional), `checkOut` (LocalDate, optional)
- **Business Rules:**
  - Returns detailed hotel object including all associated amenities.
  - With dates supplied: includes `availableRooms`, `nights`, and `totalAmount`. **Crucial:** If hotel has 0 rooms available for the range, it returns `200 OK` with `availableRooms: 0` so the frontend can display a "Sold Out" state.
- **Success Status:** `200 OK`
- **Response JSON (with dates):**
```json
{
  "id": 2,
  "name": "Goa Palms Hideaway",
  "location": "Goa",
  "address": "22 Vagator Cliff Path, Anjuna, Goa, 403509",
  "description": "An intimate boutique escape surrounded by swaying palms, designed for quiet retreats and sunset contemplation.",
  "imageUrl": null,
  "amenities": [
    "Air Conditioning",
    "Complimentary Breakfast",
    "Free Parking",
    "Wi-Fi"
  ],
  "pricePerNight": 2800.00,
  "availableRooms": 2,
  "nights": 3,
  "totalAmount": 8400.00
}
```
- **Error Codes:** `404 NOT_FOUND` (unknown `hotelId`), `400 VALIDATION_ERROR` (single date, invalid range).

---

### Endpoint 3: Create Booking Reservation (Hold) `[VERIFIED]`
- **Route:** `POST /api/bookings` `[DISCREPANCY vs historical audit text mentioning /bookings/reserve]`
- **Controller Method:** `BookingController#reserve` ([BookingController.java#L32-L37](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/controller/BookingController.java#L32-L37))
- **Request Headers:** `Content-Type: application/json`
- **Request Body JSON:**
```json
{
  "hotelId": 1,
  "checkIn": "2026-12-10",
  "checkOut": "2026-12-12",
  "guestName": "Nitin Salunkhe",
  "guestEmail": "nitin@example.com"
}
```
- **Field Validation:**
  - `hotelId`: Long, NOT NULL, $> 0$
  - `checkIn`: Date, NOT NULL, $\ge \text{today}$ (evaluated in `Asia/Kolkata`)
  - `checkOut`: Date, NOT NULL, $> \text{checkIn}$, $\le \text{today} + 365\text{ days}$
  - `nights`: $\le 30\text{ nights}$
  - `guestName`: String, NOT NULL, 1–100 characters after trim
  - `guestEmail`: String, NOT NULL, valid RFC email pattern, $\le 150$ characters
- **Success Status:** `201 Created`
- **Response Headers:** `Location: /api/bookings/HB-7K3Q9X`
- **Response Body JSON:**
```json
{
  "reference": "HB-7K3Q9X",
  "status": "HELD",
  "hotelId": 1,
  "hotelName": "Azure Bay Resort",
  "roomNumber": "101",
  "guestName": "Nitin Salunkhe",
  "guestEmail": "nitin@example.com",
  "checkIn": "2026-12-10",
  "checkOut": "2026-12-12",
  "nights": 2,
  "pricePerNight": 4500.00,
  "totalAmount": 9000.00,
  "expiresAt": "2026-11-13T12:45:00Z",
  "createdAt": "2026-11-13T12:35:00Z"
}
```
- **Error Codes:**
  - `400 VALIDATION_ERROR`: Field validation failure or malformed JSON.
  - `404 NOT_FOUND`: `hotelId` does not exist.
  - `409 SOLD_OUT`: No rooms available in the hotel for all requested nights.
  - `409 CONCURRENCY_CONFLICT`: High-contention deadlock after automatic internal retry.

---

### Endpoint 4: Confirm Booking `[VERIFIED]`
- **Route:** `POST /api/bookings/{reference}/confirm`
- **Controller Method:** `BookingController#confirm` ([BookingController.java#L43-L51](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/controller/BookingController.java#L43-L51))
- **Path Parameters:** `reference` (String, required)
- **Request Body JSON:**
```json
{
  "email": "nitin@example.com"
}
```
- **Business Rules:**
  - Verifies booking exists and normalized email matches.
  - If booking is already `CONFIRMED`: Returns `200 OK` immediately (Idempotent).
  - If booking status is `CANCELLED` or `EXPIRED`: Returns `409 INVALID_STATE`.
  - Checks hold deadline: `reserved_until > NOW()`. If deadline passed, returns `409 HOLD_EXPIRED`.
  - Promotes room nights to `BOOKED` and booking status to `CONFIRMED`. Clears `expires_at` (`expiresAt` is omitted from response JSON).
- **Success Status:** `200 OK`
- **Response Body JSON:**
```json
{
  "reference": "HB-7K3Q9X",
  "status": "CONFIRMED",
  "hotelId": 1,
  "hotelName": "Azure Bay Resort",
  "roomNumber": "101",
  "guestName": "Nitin Salunkhe",
  "guestEmail": "nitin@example.com",
  "checkIn": "2026-12-10",
  "checkOut": "2026-12-12",
  "nights": 2,
  "pricePerNight": 4500.00,
  "totalAmount": 9000.00,
  "createdAt": "2026-11-13T12:35:00Z"
}
```
- **Error Codes:**
  - `404 NOT_FOUND`: Unknown booking reference OR email does not match (identical error response to prevent enumeration).
  - `409 HOLD_EXPIRED`: Hold period lapsed prior to confirmation.
  - `409 INVALID_STATE`: Booking is already in `CANCELLED` or `EXPIRED` state.

---

### Endpoint 5: Retrieve Booking by Reference and Email `[VERIFIED]`
- **Route:** `GET /api/bookings/{reference}?email=`
- **Controller Method:** `BookingController#getBooking` ([BookingController.java#L57-L64](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/controller/BookingController.java#L57-L64))
- **Path Parameters:** `reference` (String, required)
- **Query Parameters:** `email` (String, required)
- **Business Rules:**
  - Matches booking by reference and case-insensitive trimmed guest email.
  - To prevent reference harvesting, an unknown reference and an incorrect email return the exact same `404 NOT_FOUND`.
- **Success Status:** `200 OK`
- **Response Body JSON:**
```json
{
  "reference": "HB-7K3Q9X",
  "status": "CONFIRMED",
  "hotelId": 1,
  "hotelName": "Azure Bay Resort",
  "roomNumber": "101",
  "guestName": "Nitin Salunkhe",
  "guestEmail": "nitin@example.com",
  "checkIn": "2026-12-10",
  "checkOut": "2026-12-12",
  "nights": 2,
  "pricePerNight": 4500.00,
  "totalAmount": 9000.00,
  "createdAt": "2026-11-13T12:35:00Z"
}
```
- **Error Codes:** `400 VALIDATION_ERROR` (missing email parameter), `404 NOT_FOUND` (reference not found or email mismatch).

---

### Endpoint 6: Cancel Booking `[VERIFIED]`
- **Route:** `POST /api/bookings/{reference}/cancel`
- **Controller Method:** `BookingController#cancel` ([BookingController.java#L70-L78](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/controller/BookingController.java#L70-L78))
- **Path Parameters:** `reference` (String, required)
- **Request Body JSON:**
```json
{
  "email": "nitin@example.com"
}
```
- **Business Rules:**
  - Verifies booking exists and guest email matches.
  - If booking is already `CANCELLED`: Returns `200 OK` immediately (Idempotent).
  - If booking is `EXPIRED`: Returns `409 INVALID_STATE`.
  - Date Guard: If `checkIn <= today` (in `Asia/Kolkata`), returns `409 INVALID_STATE` with message `"Cannot cancel once the stay has started."`.
  - Releases room nights back to `AVAILABLE` (`booking_id = NULL, reserved_until = NULL`) and marks booking `CANCELLED`.
- **Success Status:** `200 OK`
- **Response Body JSON:**
```json
{
  "reference": "HB-7K3Q9X",
  "status": "CANCELLED",
  "hotelId": 1,
  "hotelName": "Azure Bay Resort",
  "roomNumber": "101",
  "guestName": "Nitin Salunkhe",
  "guestEmail": "nitin@example.com",
  "checkIn": "2026-12-10",
  "checkOut": "2026-12-12",
  "nights": 2,
  "pricePerNight": 4500.00,
  "totalAmount": 9000.00,
  "createdAt": "2026-11-13T12:35:00Z"
}
```
- **Error Codes:**
  - `400 VALIDATION_ERROR`: Missing email.
  - `404 NOT_FOUND`: Booking reference unknown or email mismatch.
  - `409 INVALID_STATE`: Stay already started (`checkIn <= today`) or booking is `EXPIRED`.

---

### Universal API Error Response Format `[VERIFIED]`
All non-2xx responses conform to [ErrorResponse.java](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/dto/ErrorResponse.java):
```json
{
  "timestamp": "2026-11-13T12:35:00Z",
  "status": 409,
  "code": "SOLD_OUT",
  "message": "No rooms available for the selected dates.",
  "fieldErrors": []
}
```
When validation fails on specific fields (HTTP 400), `fieldErrors` contains field-specific details:
```json
{
  "timestamp": "2026-11-13T12:35:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Reserve request validation failed",
  "fieldErrors": [
    {
      "field": "checkOut",
      "message": "must be after checkIn"
    },
    {
      "field": "guestEmail",
      "message": "must be a well-formed email address"
    }
  ]
}
```

---

## 5. Booking Lifecycle

```
[Available Search] 
       │
       ▼
[Reserve Room: POST /api/bookings]
       │
       ├─────────────────────────────────────────┐
       ▼ (Atomic UPDATE room_night)              ▼ (Candidate fails / Sold Out)
[Status: HELD (10-min countdown)]          [409 SOLD_OUT (Rolls back)]
       │
       ├─────────────────────────┬─────────────────────────┐
       ▼ (Guest confirms)        ▼ (10 min expires)        ▼ (Guest cancels)
[POST /api/bookings/{ref}/confirm] [BookingExpiryJob: 60s] [POST /api/bookings/{ref}/cancel]
       │                                 │                         │
       ▼                                 ▼                         ▼
[Status: CONFIRMED]              [Status: EXPIRED]         [Status: CANCELLED]
(room_night -> BOOKED)           (room_night -> AVAILABLE) (room_night -> AVAILABLE)
       │                                                           ▲
       └────────────────── Guest cancels before stay ──────────────┘
```

### Stage-by-Stage Implementation Details `[VERIFIED]`

1. **Availability Search & Candidate Discovery:**
   - [RoomNightRepository.java#L27-L50](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/repository/RoomNightRepository.java#L27-L50): Runs `findCandidateRooms` selecting up to 5 candidate rooms (`ORDER BY r.id ASC LIMIT 5`) where count of `AVAILABLE` nights equals requested stay duration.
2. **Booking Insert ([BookingTransactionalService.java#L121-L135](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/service/BookingTransactionalService.java#L121-L135)):**
   - Per [Amendment A1](file:///e:/hotel_booking/docs/01-final-design.md#L89-L93), inserts booking with status `HELD`, `room_id = candidate[0]`, price snapshot, unique reference, and `expires_at = NOW() + 10 min`.
3. **Atomic Claim & Fallback Loop ([BookingTransactionalService.java#L138-L167](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/service/BookingTransactionalService.java#L138-L167)):**
   - For each candidate:
     ```sql
     UPDATE room_night
     SET status = 'RESERVED', booking_id = :bid, reserved_until = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
     WHERE room_id = :candidateId AND stay_date >= :in AND stay_date < :out AND status = 'AVAILABLE';
     ```
   - If `affected == nights`: room successfully claimed; break loop.
   - If `affected != nights` (concurrent transaction claimed some nights): executes `revertPartialClaim` releasing any rows taken by this booking:
     ```sql
     UPDATE room_night SET status = 'AVAILABLE', booking_id = NULL, reserved_until = NULL WHERE booking_id = :bid;
     ```
   - Moves to next candidate (reassigning `booking.room_id`). If all candidates exhausted, throws `SoldOutException` (transaction rolls back, deleting the `booking` row).
4. **Confirmation Transition ([BookingTransactionalService.java#L205-L225](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/service/BookingTransactionalService.java#L205-L225)):**
   - Guarded conditional update:
     ```sql
     UPDATE room_night SET status = 'BOOKED', reserved_until = NULL 
     WHERE booking_id = :bid AND status = 'RESERVED' AND reserved_until > NOW();
     ```
   - Updates `booking SET status = 'CONFIRMED', expires_at = NULL WHERE id = :bid AND status = 'HELD'`.
5. **Scheduled Expiry Background Job ([BookingExpiryJob.java#L38-L56](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/service/BookingExpiryJob.java#L38-L56)):**
   - Runs every 60 seconds (`app.expiry.fixed-delay-ms=60000`) in a single transaction:
     ```sql
     UPDATE room_night SET status = 'AVAILABLE', booking_id = NULL, reserved_until = NULL 
     WHERE status = 'RESERVED' AND reserved_until < NOW();

     UPDATE booking SET status = 'EXPIRED' 
     WHERE status = 'HELD' AND expires_at < NOW();
     ```

---

## 6. Pricing, Date and Validation Rules

Derived from [BookingValidator.java](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/service/BookingValidator.java) and [PricingService.java](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/service/PricingService.java):

| Validation Rule | Backend Specification | Enforced At | Error Field / Code |
|---|---|---|---|
| **Check-in not in past** | `checkIn >= today` (in `Asia/Kolkata`) | Backend | `checkIn`: `"cannot be in the past"` (`400`) |
| **Check-out after check-in** | `checkOut > checkIn` | Backend | `checkOut`: `"must be after checkIn"` (`400`) |
| **Minimum stay duration** | Exactly 1 night (`checkOut > checkIn`) | Backend | `checkOut`: `"must be after checkIn"` (`400`) |
| **Maximum stay duration** | `nights <= 30` (`app.booking.max-nights`) | Backend | `checkOut`: `"must not exceed 30 nights"` (`400`) |
| **Bookable inventory window** | `checkOut <= today + 365 days` | Backend | `checkOut`: `"stay cannot extend beyond 365 days window"` (`400`) |
| **Stay range semantics** | Half-open interval `[checkIn, checkOut)` | Backend | Checkout day is not an occupied night |
| **Stay duration calculation** | `ChronoUnit.DAYS.between(checkIn, checkOut)` | Backend | `nights` |
| **Price calculation** | `nights * pricePerNight` | Backend | `totalAmount` (`BigDecimal`, scale 2, `HALF_UP`) |
| **Client-sent total amount** | **Ignored / Not accepted** in request DTO | Backend | Backend is sole authority for pricing |
| **Guest name** | 1–100 characters after `.trim()` | Backend | `guestName`: `"must be between 1 and 100 characters"` (`400`) |
| **Guest email** | `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`, $\le 150$ chars | Backend | `guestEmail`: `"must be a well-formed email address"` (`400`) |
| **Email normalization** | Stored and compared as `.trim().toLowerCase()` | Backend | Transparent normalization |

---

## 7. Availability and Inventory

1. **Granularity:** Availability is tracked at the daily physical room level in the `room_night` table.
2. **Availability Definition:** A hotel has availability for `[checkIn, checkOut)` if and only if at least one physical room has status `'AVAILABLE'` for **every individual date** from `checkIn` up to `checkOut - 1 day`.
3. **Back-to-Back Stays:** Because stays are half-open intervals `[checkIn, checkOut)`, Guest 1 checking out on `2026-12-12` does not occupy the night of `2026-12-12`. Guest 2 checking in on `2026-12-12` can book the exact same room with zero conflict ([HotelControllerIntegrationTest.java#L167](file:///e:/hotel_booking/backend/src/test/java/com/hotelbooking/controller/HotelControllerIntegrationTest.java#L167)).
4. **Hold Status Concealment:** A room night in status `RESERVED` is excluded from search results until either confirmed or expired.
5. **Database Invariants Enforced ([db/audit/invariants.sql](file:///e:/hotel_booking/db/audit/invariants.sql)):**
   - `INV-01`: An active booking holds exactly `nights` room_night rows.
   - `INV-02`: Night status matches booking status (`HELD` $\rightarrow$ `RESERVED`, `CONFIRMED` $\rightarrow$ `BOOKED`).
   - `INV-05`: **No double bookings:** No two active bookings share the same room on any night.
   - `INV-06`: Mathematical precision: `totalAmount == nights * pricePerNight`.

---

## 8. Concurrency and Transaction Handling

1. **No In-Memory Locking:** Zero synchronized blocks or in-memory JVM locks exist (`git grep "synchronized"` returns 0). The backend runs safely across multiple stateless server nodes.
2. **Database Isolation:** MySQL default `REPEATABLE READ` is preserved.
3. **Deterministic Row-Lock Order:** All candidate rooms are sorted by `room_id ASC`, and room nights are processed in `stay_date ASC` order. This global lock ordering prevents deadlocks in almost all concurrent transactions.
4. **Deadlock Retry Wrapper ([DeadlockRetryWrapper.java](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/service/DeadlockRetryWrapper.java)):**
   - Catches MySQL Error `1213` (SQLState `40001` deadlock) on the reserve transaction and transparently retries the entire transactional unit once.
   - If the second attempt also deadlocks, it throws `ConcurrencyConflictException` $\rightarrow$ surfaced to client as HTTP `409 CONCURRENCY_CONFLICT`.
5. **Confirm vs. Expiry Race Elimination ([ConfirmVsExpiryConcurrencyTest.java](file:///e:/hotel_booking/backend/src/test/java/com/hotelbooking/concurrency/ConfirmVsExpiryConcurrencyTest.java)):**
   - `confirmBooking` updates only where `reserved_until > NOW()`.
   - `BookingExpiryJob` updates only where `reserved_until < NOW()`.
   - Even if both race at the exact same millisecond, opposing WHERE guards guarantee exactly one winner. If expiry wins, confirm receives `409 HOLD_EXPIRED`. If confirm wins, expiry finds 0 rows to expire.

---

## 9. Security and Error Handling

| Security Concern | Implementation Reality | Frontend Implication |
|---|---|---|
| **User Authentication** | `[VERIFIED]` No user accounts, passwords, or JWT tokens. | Frontend must not present login/signup forms. |
| **Booking Authorization** | `[VERIFIED]` Authorization requires matching `reference` + `guestEmail`. | Frontend must prompt for reference and email together. |
| **Information Leakage** | `[VERIFIED]` Incorrect email or missing reference returns uniform `404 NOT_FOUND`. | Prevents bad actors from guessing valid references. |
| **PII in Server Logs** | `[VERIFIED]` Guest emails are excluded from application logs. | Compliant with privacy standards. |
| **SQL Injection Prevention** | `[VERIFIED]` 100% of queries use parameterized `JdbcTemplate` (`?`) or Spring Data `@Query`. | Safe against injection attacks. |
| **Exception Masking** | `[VERIFIED]` Internal exceptions masked to generic `500 INTERNAL_ERROR`. | Zero database error messages or Java stack traces exposed. |
| **CORS Configuration** | `[VERIFIED]` **No CORS support exists in backend.** | **Direct browser cross-origin requests will fail.** Frontend dev server MUST proxy API calls to port 8080. |

---

## 10. Existing Test Coverage

The test suite contains **98 automated tests** across unit, integration, and high-concurrency suites:

| Test Class | Category | Test Count | Key Areas Covered |
|---|---|---|---|
| `PricingServiceTest` | Unit | 3 | Nights calculation, BigDecimal rounding, invalid ranges |
| `BookingValidatorTest` | Unit | 9 | Date validation, 30-night limit, 365-day window, email regex |
| `ReferenceGeneratorTest` | Unit | 4 | Format `HB-XXXXXX`, entropy, retry on collision |
| `DeadlockRetryWrapperTest` | Unit | 5 | Single retry on MySQL 1213 deadlock, rethrow of other exceptions |
| `DatabaseSchemaValidationTest` | Database | 1 | Entity-to-schema DDL validation (`ddl-auto=validate`) |
| `DatabaseSeedDataTest` | Database | 4 | 5 hotels, 25 rooms, 8 amenities, non-null properties |
| `InventoryInitializerTest` | Database | 4 | Idempotent generation of 9,125 room nights |
| `TestDatabaseBootstrapTest` | Database | 3 | Safety check: refuses to run on non-`_test` DB |
| `RoomNightRepositoryTest` | Repository | 12 | Atomic conditional updates, row-lock order, candidate queries |
| `BookingRepositoryTest` | Repository | 3 | Status updates, idempotency, foreign key constraints |
| `HotelControllerIntegrationTest` | API Integration | 10 | Browse vs search modes, location filters, back-to-back stays |
| `ReserveIntegrationTest` | API Integration | 7 | 10-minute hold creation, candidate fallback, sold out |
| `BookingLifecycleIntegrationTest`| API Integration | 14 | Confirm, retrieve, cancel, hold expiry, start-date guard |
| `ApiContractIntegrationTest` | Contract Hardening| 11 | Exact error schemas, 400/404/409 codes, masked 500s |
| `BookingConcurrencyTest` | Concurrency Stress | 2 | 10 threads booking last 5 rooms; 12 mixed overlapping ranges |
| `BookingLifecycleConcurrencyTest`| Concurrency Stress | 4 | Concurrent confirms, concurrent cancels, confirm vs cancel |
| `ConfirmVsExpiryConcurrencyTest` | Concurrency Stress | 2 | Race at exact expiry second between confirm and background job |
| **Total** | | **98 Tests** | **All 98 tests active (`0 @Disabled`, `0 flakes`)** |

---

## 11. Audit Findings and F-01 Status

### Historical Audit (`AUDIT-20261113-1` at commit `d750567`)
- **Status at commit `d750567`:** 31 PASS / 1 FAIL.
- **Finding F-01 (HIGH):** Mutation M5 (omitting `roomNightRepository.revertPartialClaim` during candidate fallback) survived because `ReserveIntegrationTest#testReserveCandidateFallback` only checked that Candidate 2 succeeded, but did not assert that Candidate 1 had 0 claimed nights.

### Re-verification in Current Codebase `[VERIFIED]`
1. **Commit `58c2b93`:** Strengthened `ReserveIntegrationTest#testReserveCandidateFallback` ([ReserveIntegrationTest.java#L245-L261](file:///e:/hotel_booking/backend/src/test/java/com/hotelbooking/controller/ReserveIntegrationTest.java#L245-L261)) with explicit assertions:
   ```java
   Integer candidate1Nights = jdbcTemplate.queryForObject(
       "SELECT COUNT(*) FROM room_night WHERE booking_id = ? AND room_id = ?",
       Integer.class, actualBookingId, candidate1
   );
   assertThat(candidate1Nights).isEqualTo(0);
   ```
2. **Mutation Verification:** When mutation M5 is introduced, `testReserveCandidateFallback` now fails immediately with `expected: <0> but was: <2>`.
3. **Conclusion:** **Finding F-01 is completely RESOLVED.** All 32 audit checklist items now evaluate to `PASS`.

---

## 12. Frontend Integration Requirements

### Core User Journeys
1. **Browse & Search:**
   - Default view: Browse all hotels.
   - User inputs Location, Check-in, Check-out.
   - Both dates must be selected before initiating a search.
   - Search results display `availableRooms`, `nights`, and `totalAmount`.
2. **Hotel Detail & Room Selection:**
   - Shows amenities, full address, description, and price per night.
   - When searching with dates, if `availableRooms == 0`, UI renders "Sold Out" and disables the booking button.
3. **Reserve (Start 10-Minute Hold):**
   - User enters Name and Email.
   - Submits `POST /api/bookings`.
   - On success (`201 Created`), backend returns `reference`, `status: "HELD"`, and `expiresAt`.
4. **Hold Countdown & Confirmation:**
   - Frontend starts a local visual countdown timer based on `expiresAt`.
   - **Crucial Rule:** The frontend countdown is for visual feedback only. The backend database clock is the sole authority.
   - User clicks "Confirm Booking". Submits `POST /api/bookings/{reference}/confirm` with `{ "email": "..." }`.
   - If user confirms after the 10-minute hold has expired, backend returns `409 HOLD_EXPIRED`. The frontend must display an expired-hold notice and prompt the user to restart the search.
5. **Manage Booking (Retrieve & Cancel):**
   - User navigates to "Manage Booking" / "Find My Booking".
   - Inputs Booking Reference (`HB-XXXXXX`) and Email address.
   - Submits `GET /api/bookings/{reference}?email={email}`.
   - Displays booking details and status (`HELD`, `CONFIRMED`, `CANCELLED`, `EXPIRED`).
   - If status is `CONFIRMED` and `checkIn > today`, displays "Cancel Booking" button.
   - Clicking cancel submits `POST /api/bookings/{reference}/cancel` with `{ "email": "..." }`.

---

## 13. TypeScript Interface Proposals `[VERIFIED against Backend DTOs]`

These interfaces directly mirror the backend record DTOs and Jackson serialization rules:

```typescript
// ============================================================================
// Hotel Models (matching HotelResponse.java)
// ============================================================================

export interface HotelSummary {
  id: number;
  name: string;
  location: string;
  address: string;
  description: string | null;
  imageUrl: string | null;
  amenities: string[];
  pricePerNight: number; // Stored as BigDecimal, serialized as JSON number
  // Fields present ONLY in search mode (omitted in browse mode)
  availableRooms?: number;
  nights?: number;
  totalAmount?: number;
}

// ============================================================================
// Booking Request Payloads (matching ReserveBookingRequest & EmailVerificationRequest)
// ============================================================================

export interface ReserveBookingPayload {
  hotelId: number;
  checkIn: string;   // ISO-8601 Date: "YYYY-MM-DD"
  checkOut: string;  // ISO-8601 Date: "YYYY-MM-DD"
  guestName: string; // 1-100 characters
  guestEmail: string;// valid email, <= 150 characters
}

export interface EmailVerificationPayload {
  email: string;
}

// ============================================================================
// Booking Response Models (matching BookingResponse.java)
// ============================================================================

export type BookingStatus = 'HELD' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

export interface BookingDetails {
  reference: string;
  status: BookingStatus;
  hotelId: number;
  hotelName: string;
  roomNumber: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;   // "YYYY-MM-DD"
  checkOut: string;  // "YYYY-MM-DD"
  nights: number;
  pricePerNight: number;
  totalAmount: number;
  // Present while HELD; omitted once CONFIRMED
  expiresAt?: string; // ISO-8601 UTC Instant: "YYYY-MM-DDTHH:mm:ssZ"
  createdAt: string;  // ISO-8601 UTC Instant: "YYYY-MM-DDTHH:mm:ssZ"
}

// ============================================================================
// Universal API Error Models (matching ErrorResponse.java & FieldErrorItem.java)
// ============================================================================

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'SOLD_OUT'
  | 'HOLD_EXPIRED'
  | 'INVALID_STATE'
  | 'CONCURRENCY_CONFLICT'
  | 'INTERNAL_ERROR';

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  timestamp: string; // ISO-8601 UTC Instant: "YYYY-MM-DDTHH:mm:ssZ"
  status: number;    // HTTP status code (e.g. 400, 404, 409, 500)
  code: ApiErrorCode;
  message: string;
  fieldErrors: FieldError[];
}
```

---

## 14. Confirmed Facts `[VERIFIED]`

1. **Base Path:** `/api`
2. **Endpoints:**
   - `GET /api/hotels`
   - `GET /api/hotels/{hotelId}`
   - `POST /api/bookings`
   - `POST /api/bookings/{reference}/confirm`
   - `GET /api/bookings/{reference}?email={email}`
   - `POST /api/bookings/{reference}/cancel`
3. **No `/api/bookings/reserve`:** The reservation endpoint is strictly `POST /api/bookings`.
4. **Dates are Half-Open:** `[checkIn, checkOut)`. Minimum stay is 1 night; max stay is 30 nights.
5. **Hold Duration:** Exactly 10 minutes (`600 seconds`), enforced by MySQL database clock (`NOW()`).
6. **Background Expiry:** Executes every 60 seconds (`60000 ms`).
7. **Money:** Decimal scale 2. Floating-point numbers are prohibited in database and backend domain math.
8. **Stateless Identity:** Zero authentication tokens or sessions.

---

## 15. Unknowns and Discrepancies

### Identified Discrepancies `[DISCREPANCY]`
1. **Endpoint Path Discrepancy:**
   - *Historical doc text:* Some checklist notes mentioned `POST /bookings/reserve`.
   - *Verified Code:* [BookingController.java#L32-L37](file:///e:/hotel_booking/backend/src/main/java/com/hotelbooking/controller/BookingController.java#L32-L37) exposes `@PostMapping` directly on `@RequestMapping("/api/bookings")`. The real path is `POST /api/bookings`.
2. **Test Count Evolution:**
   - *Historical audit AUDIT-20261113-1:* Recorded 87 tests.
   - *Current Code:* Commit `98e7df5` added `ApiContractIntegrationTest` with 11 contract tests, bringing current test suite count to **98 tests**.

### Known Limitations / System Truths `[VERIFIED]`
1. **CORS Missing:** Backend does not emit `Access-Control-Allow-Origin` headers. Direct cross-origin browser fetch calls will fail unless proxied.
2. **Image URLs Null:** All sample hotels in `db/seed.sql` currently have `image_url: null`. The frontend must provide fallback/placeholder images for hotels.
3. **Single Room Category:** All rooms in a hotel share the same price and single category. The frontend should not display a "Room Type" selector.

---

## 16. Frontend Integration Risks & Mitigations

| Risk | Severity | Root Cause | Required Frontend Mitigation |
|---|---|---|---|
| **CORS Browser Block** | **CRITICAL** | Backend does not implement CORS headers. | Frontend dev tooling (Vite/Webpack) must proxy `/api` requests to `http://localhost:8080`. |
| **Clock Drift on Hold Timer** | **HIGH** | Client computer clock may be skewed relative to server MySQL clock. | Never rely on local system time to determine hold validity. Compute countdown relative to server's `expiresAt`. If backend returns `409 HOLD_EXPIRED`, immediately transition UI to expired state. |
| **Search Availability Lag** | **MEDIUM** | Background expiry job runs every 60 seconds. A room expired 10 seconds ago remains hidden from search until the job runs. | Inform users that availability updates dynamically; handle race conditions gracefully if user attempts to reserve. |
| **Single-Date Validation Failure** | **MEDIUM** | Passing one date to `GET /api/hotels` triggers HTTP 400. | Frontend datepicker must ensure both check-in and check-out are chosen before executing a search query. |
| **Null Image URLs** | **LOW** | Seed data has `image_url: null`. | Frontend must provide attractive default/fallback hotel card images based on hotel ID or location. |

---

*Report compiled and verified against commit `07b6a0b` on branch `main`.*
