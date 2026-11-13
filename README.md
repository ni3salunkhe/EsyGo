# Hotel Booking Portal - Backend (Phase 1)

A robust, enterprise-grade hotel booking REST API built with Java 17, Spring Boot 3.4.4, and MySQL 8.
Strictly implements the frozen specifications in `docs/` and verifies all invariants against real MySQL transactions.

---

## 1. Prerequisites

- **Java Development Kit (JDK):** Version 17 LTS (e.g., Eclipse Adoptium Temurin 17.0.13+)
- **Build Tool:** Apache Maven 3.9+ (or Maven Wrapper `mvnw`)
- **Database:** MySQL 8.0.16+ (MySQL 8.0.46 Community Server tested)
- **Git & PowerShell / Bash:** Windows PowerShell or Git Bash for script execution

---

## 2. Database Setup Instructions

The portal operates on two MySQL 8 databases:
1. `hotel_booking`: Development and local runtime database.
2. `hotel_booking_test`: Dedicated test database (automated tests drop and recreate tables here; the test harness refuses to run against any database whose name does not end with `_test`).

### Step 2.1: Create Databases and User

Open MySQL shell as administrator (e.g., `root`):

```sql
CREATE DATABASE IF NOT EXISTS hotel_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS hotel_booking_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Optional: Create dedicated application user if not using existing credentials
CREATE USER IF NOT EXISTS 'hotel_user'@'localhost' IDENTIFIED BY 'change_me_secure_password';
GRANT ALL PRIVILEGES ON hotel_booking.* TO 'hotel_user'@'localhost';
GRANT ALL PRIVILEGES ON hotel_booking_test.* TO 'hotel_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 2.2: Apply Schema and Seed Data

Apply the authoritative frozen schema (`db/schema.sql`) and sample data (`db/seed.sql`) to `hotel_booking`:

```bash
# On Linux / macOS or Git Bash (Windows):
mysql -u hotel_user -p hotel_booking < db/schema.sql
mysql -u hotel_user -p hotel_booking < db/seed.sql

# On Windows PowerShell (using installed mysql binary):
Get-Content db\schema.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u hotel_user -p hotel_booking
Get-Content db\seed.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u hotel_user -p hotel_booking
```

*Note: Automated tests automatically apply `db/schema.sql` to `hotel_booking_test` during test execution.*

### Step 2.3: Configure Environment Variables

Credentials must be supplied exclusively via environment variables (never committed to the repository):

Create a local `.env` file in the project root (ignored by git per `.gitignore`):

```properties
DB_URL=jdbc:mysql://localhost:3306/hotel_booking
DB_USERNAME=hotel_user
DB_PASSWORD=change_me_secure_password

TEST_DB_URL=jdbc:mysql://localhost:3306/hotel_booking_test
TEST_DB_USERNAME=hotel_user
TEST_DB_PASSWORD=change_me_secure_password

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=hotel_booking
```

---

## 3. Building, Running, and Testing

### Run the Application

```bash
cd backend
mvn spring-boot:run
```

On startup, `InventoryInitializer` automatically tops up 365 days of `room_night` inventory for all physical rooms using idempotent `INSERT IGNORE` queries.

### Run Automated Tests

Automated tests execute against the real MySQL test database `hotel_booking_test`:

```bash
cd backend
mvn test
```

### Verify Invariants

Run the invariant verification script against the populated database:

```bash
# Using bash:
export DB_NAME="hotel_booking"
export DB_USER="hotel_user"
export DB_PASSWORD="change_me_secure_password"
bash scripts/verify-invariants.sh

# Or directly in MySQL:
mysql -u hotel_user -p hotel_booking < db/audit/invariants.sql
```

---

## 4. Surprise Feature: 10-Minute Room Hold

The backend implements an automatic 10-minute hold mechanism upon reservation per `docs/01-final-design.md` Section 9:

### What
- When a guest reserves a room (`POST /api/bookings`), the backend does not immediately book the room permanently. Instead, it transitions candidate room nights to `RESERVED` and sets `booking.status = 'HELD'` with an expiration timestamp (`expiresAt` = `now + 10 minutes`).
- The response returns `reference`, `status: "HELD"`, and `expiresAt` so the client UI can render a real-time countdown timer.
- The guest must explicitly confirm the booking (`POST /api/bookings/{reference}/confirm`) within the 10-minute window. Confirmation transitions the status to `CONFIRMED` and marks the room nights as permanently `BOOKED`.

### Why
- **Solves the Checkout Race Condition:** Eliminates the frustration of "someone booked the room while I was typing my details" or entering payment.
- **Prevents Permanent Inventory Starvation:** If a guest abandons the reservation flow or closes their browser, inventory is not tied up indefinitely.
- **Transparent Concurrency Guarantees:** Gives the user-facing booking process a clear, predictable consistency boundary without requiring distributed locks.

### How (Implementation & Invariants)
1. **Atomic Guarded Claim (`RoomNightRepository`):**
   ```sql
   UPDATE room_night
   SET status = 'RESERVED', booking_id = ?, reserved_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)
   WHERE room_id = ? AND stay_date >= ? AND stay_date < ? AND status = 'AVAILABLE';
   ```
   If affected rows does not equal the requested number of nights, a partial claim revert releases any claimed nights, and the service retries with the next candidate room.
2. **Guarded Confirmation (`BookingCustomRepositoryImpl`):**
   ```sql
   UPDATE booking
   SET status = 'CONFIRMED', confirmed_at = NOW(), expires_at = NULL
   WHERE reference = ? AND status = 'HELD' AND reserved_until > NOW();
   ```
   If the deadline has passed, the query affects 0 rows, and the API returns HTTP 409 `HOLD_EXPIRED`.
3. **Background Expiry Scheduled Job (`BookingExpiryJob`):**
   - Runs every 60 seconds (`hotel.booking.expiry-job.fixed-rate-ms=60000`).
   - Identifies bookings where `status = 'HELD' AND expires_at <= NOW()`.
   - Transitions booking status to `EXPIRED` and atomically releases room nights back to `status = 'AVAILABLE'`, `booking_id = NULL`.
4. **Deadline Race Resolution (`CONC-03`):**
   - Simultaneous confirm vs expiry job at the deadline is arbitrated by row-level database locks. Exactly one operation succeeds; double transitions are impossible.

---

## 5. Core Architecture & Design Assumptions

As documented in `docs/01-final-design.md` Section 11:

1. **Half-Open Stay Ranges `[check_in, check_out)`:**
   - A stay begins on `check_in` and ends on `check_out`. The check-out date is departure day, not an overnight stay.
   - Back-to-back bookings (e.g. Guest A check-out `2026-12-10` and Guest B check-in `2026-12-10`) do not conflict and are available on the same physical room (`SRC-04`).
2. **Single Room Category & One Room Per Booking:**
   - Each hotel has physical rooms of a single standard category.
   - A booking request reserves exactly one room for the specified dates.
3. **365-Day Inventory Window & Max Stay:**
   - Bookings can be made up to 365 days in advance (`check_out <= today + 365`).
   - Maximum continuous stay length is 30 nights (`VAL-05`).
4. **Backend-Calculated Pricing & Monetary Precision:**
   - All price per night and total amounts use `DECIMAL(10,2)` in MySQL and `BigDecimal` in Java.
   - The total amount is computed strictly on the backend (`nights * price_per_night`); client-sent totals are rejected or ignored.
5. **Cancellations Disallowed Post Check-In:**
   - A booking can only be cancelled before the check-in date (`check_in > today`). Once the stay date has arrived or passed, cancellation returns HTTP 409 `INVALID_STATE` (`CAN-04`).
   - Cancelling a `HELD` or `CONFIRMED` booking immediately releases all room nights back to `AVAILABLE`.
6. **No User Accounts (Guest Identity via Reference + Email):**
   - Retrieve (`GET /api/bookings/{reference}?email=...`) and cancel (`POST /api/bookings/{reference}/cancel`) authenticate guests by matching `booking.reference` and `guest_email`.
   - Mismatched emails return uniform HTTP 404 `NOT_FOUND` identical to an unknown reference, preventing account/booking enumeration.
7. **Search Consistency & Expiry Job Window:**
   - Search results query room nights with `status = 'AVAILABLE'`. A lapsed hold is released to search as soon as the background expiry job runs (interval $\le 60$ seconds).
8. **Deadlock Retry Wrapper:**
   - High-concurrency overlapping bookings may trigger MySQL InnoDB deadlock error 1213. The application wraps reservation in `DeadlockRetryWrapper` with `@Retryable` to transparently retry once after exponential backoff before reporting `CONCURRENCY_CONFLICT`.

---

## 6. API Summary & Error Contract

Base URL path: `/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/hotels` | Browse hotels (no dates) or search by location & dates (`checkIn`, `checkOut`) |
| `GET` | `/api/hotels/{id}` | Get hotel details (with optional dates to check availability) |
| `POST` | `/api/bookings` | Reserve a room (starts 10-minute hold; returns 201 + `Location`) |
| `POST` | `/api/bookings/{ref}/confirm` | Confirm a held booking (`{"email": "..."}`) |
| `GET` | `/api/bookings/{ref}?email=...` | Retrieve booking details |
| `POST` | `/api/bookings/{ref}/cancel` | Cancel a held or confirmed booking (`{"email": "..."}`) |

### Error Response Shape
All error responses strictly adhere to `docs/02-api-contract.md` Section 7:
```json
{
  "timestamp": "2026-12-01T10:05:30Z",
  "status": 409,
  "code": "SOLD_OUT",
  "message": "No rooms available for the selected dates.",
  "fieldErrors": []
}
```
Stack traces, SQL syntax, and internal Java class names are never exposed. Guest emails are never written to application logs.
