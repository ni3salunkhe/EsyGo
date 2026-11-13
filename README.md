# Hotel Booking Portal (Full-Stack: Spring Boot + React)

A complete, enterprise-grade hotel booking portal featuring a Java 17 / Spring Boot 3.4.4 REST API, MySQL 8 transactional engine, and a modern, responsive React 18 single-page application built with Vite and Tailwind CSS.

---

## 1. System Architecture & Prerequisites

- **Backend:**
  - Java Development Kit (JDK): Version 17 LTS (e.g., Eclipse Adoptium Temurin 17.0.13+)
  - Build Tool: Apache Maven 3.9+ (or Maven Wrapper `mvnw`)
  - Database: MySQL 8.0.16+ (MySQL 8.0.46 Community Server tested)
- **Frontend:**
  - Runtime: Node.js 18+ (Node.js 20 LTS recommended) & npm
  - Framework: React 18.3.1, Vite 6, Tailwind CSS 3.4, Lucide Icons
  - Test Harness: Vitest 2.1, React Testing Library, JSDOM
- **Environment:**
  - Windows PowerShell or Git Bash for script execution

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

Apply the schema (`db/schema.sql`) and sample data (`db/seed.sql`) to `hotel_booking`:

```bash
# On Linux / macOS or Git Bash (Windows):
mysql -u hotel_user -p hotel_booking < db/schema.sql
mysql -u hotel_user -p hotel_booking < db/seed.sql

# On Windows PowerShell (using installed mysql binary):
Get-Content db\schema.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u hotel_user -p hotel_booking
Get-Content db\seed.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u hotel_user -p hotel_booking
```

*Note: Automated tests automatically apply `db/schema.sql` to `hotel_booking_test` during test execution.*

### Step 2.3: Loading Provided CSV Data into MySQL

If importing hotel, room, and gallery inventory from provided CSV data files:

1. Ensure the database schema has been applied first (`db/schema.sql`).
2. Use one of the following methods to load the data into the `hotel_booking` database.

#### Option A: Direct SQL Import Script (`db/import_csv_data.sql`)

If using the pre-compiled SQL dump generated from the provided CSV dataset:

```bash
# On Linux / macOS or Git Bash (Windows):
mysql -u hotel_user -p hotel_booking < db/import_csv_data.sql

# On Windows PowerShell:
Get-Content db\import_csv_data.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u hotel_user -p hotel_booking
```

#### Option B: MySQL Command-Line (`LOAD DATA LOCAL INFILE`)

To load directly from raw CSV files, connect to MySQL with `--local-infile=1`:

```bash
mysql --local-infile=1 -u hotel_user -p hotel_booking
```

Execute the import queries (adjust file paths to point to the provided CSV files):

```sql
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Hotels
LOAD DATA LOCAL INFILE 'path/to/provided/hotel.csv'
INTO TABLE hotel
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(id, name, location, address, description, price_per_night, image_url);

-- 2. Amenities
LOAD DATA LOCAL INFILE 'path/to/provided/amenity.csv'
INTO TABLE amenity
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(id, name);

-- 3. Hotel-Amenity Links
LOAD DATA LOCAL INFILE 'path/to/provided/hotel_amenity.csv'
INTO TABLE hotel_amenity
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(hotel_id, amenity_id);

-- 4. Rooms
LOAD DATA LOCAL INFILE 'path/to/provided/room.csv'
INTO TABLE room
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(id, hotel_id, room_number);

-- 5. Hotel Gallery Images
LOAD DATA LOCAL INFILE 'path/to/provided/hotel_image.csv'
INTO TABLE hotel_image
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(id, hotel_id, image_url, caption, display_order, is_primary);

SET FOREIGN_KEY_CHECKS = 1;
```

#### Option C: GUI Import (MySQL Workbench / DBeaver)
1. Open MySQL Workbench/DBeaver and connect to the `hotel_booking` schema.
2. For each table (`hotel`, `amenity`, `hotel_amenity`, `room`, `hotel_image`), right-click the table name and select **Table Data Import Wizard**.
3. Browse to the corresponding provided CSV file, confirm field mappings, and complete the import.

*Note: Once hotel and room data are loaded, starting the Spring Boot backend (`mvn spring-boot:run`) will automatically and idempotently initialize 365 days of `room_night` availability inventory for every room.*

### Step 2.4: Configure Environment Variables

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

## 3. Running the Backend

### Run the Application

```bash
cd backend
mvn spring-boot:run
```
The backend starts on `http://localhost:8080`. On startup, `InventoryInitializer` automatically tops up 365 days of `room_night` inventory for all physical rooms using idempotent `INSERT IGNORE` queries.

### Run Automated Backend Tests

Automated tests execute against the real MySQL test database `hotel_booking_test`:

```bash
cd backend
mvn test
```
*Current test suite: 99 tests passing, 0 failures, 0 errors, 0 skipped.*

### Verify Database Invariants

Run the invariant verification script against the populated database:

```bash
# Git Bash:
./scripts/verify-invariants.sh

# Or direct MySQL query execution:
mysql -u hotel_user -p hotel_booking < db/audit/invariants.sql
```
All 10 invariant checks (`INV-01` through `INV-10`) must report 0 violations.

---

## 4. Running the Frontend

The guest-facing frontend is a single-page application located in `frontend/`.

### Install Dependencies

```bash
cd frontend
npm install
```

### Start Development Server

```bash
cd frontend
npm run dev
```
The frontend starts on `http://localhost:5173`. Vite is pre-configured with a development proxy that transparently forwards all `/api/*` network requests to the Spring Boot backend running on `http://localhost:8080`:

```javascript
// vite.config.js
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true
    }
  }
}
```

### Run Frontend Automated Tests

```bash
cd frontend
npm test
```
Executes the comprehensive Vitest test suite covering all UI components, guest journeys, API error contracts, image galleries, and accessibility:
*Current frontend test suite: 98 tests passing across 10 test suites.*

### Production Build

```bash
cd frontend
npm run build
```
Generates the optimized static distribution bundle in `frontend/dist/`.

---

## 5. End-to-End User Experience & Flow Architecture

The user interface follows an Apple/RedBus-inspired clean, tactile design language with robust state handling and zero synthetic data fabrication:

### 1. Discovery & Search (`LandingPage`, `SearchCapsule`)
- **Browse Mode:** When no dates are specified, all hotels are displayed with base pricing and amenity badges. Date-dependent availability (`availableRooms`, `nights`, `totalAmount`) is omitted per API contract.
- **Search Mode:** Validates check-in/check-out dates (`checkOut > checkIn`, check-in cannot be in the past). Only hotels with confirmed availability are shown, displaying available room count and total price calculated by the backend.
- **Client-Side Filtering & Sorting:** Fast filtering by hotel name or location substring, multi-select amenity pills, and price slider/sorting without redundant network roundtrips.
- **Loading State:** YouTube-style pulse skeletons prevent visual layout shift.

### 2. Hotel Details & Multi-Image Gallery (`HotelDetailPage`, `HotelMedia`)
- **Constrained Layout:** Desktop gallery constrained to `max-w-[1250px]` and 310–320px height target to keep key booking details visible above the fold.
- **65% / 35% Balanced Media Presentation:**
  - Primary photograph on the left (65% width) displaying `images[0]` in high resolution.
  - Secondary image stack on the right (35% width) with subtle `+N more` overlay when additional photos exist.
- **Responsive Adaptations:** Proportional height scaling on tablets; compact primary image with touch-scrollable horizontal thumbnail strip on mobile.
- **Full-Screen Lightbox:** Accessible modal dialog with keyboard Arrow navigation (Left/Right), photo index indicator, and Escape dismissal.
- **Non-Photographic Fallback:** Hotels without gallery images render an elegant placeholder ("Photos coming soon") with building iconography, strictly avoiding fabricated stock imagery.
- **Sold-Out Guard:** If `availableRooms === 0`, a prominent "Sold Out" badge is shown and booking actions are disabled.

### 3. Guest Hold & 10-Minute Reservation (`GuestForm`, `HoldReviewModal`, `CountdownTimer`)
- **Hold Initiation:** Submits guest name and email to `POST /api/bookings`. The total amount is computed strictly on the backend (`nights * pricePerNight`); client-side tampering is impossible.
- **10-Minute Hold Countdown:** A real-time countdown timer computes remaining seconds against backend `expiresAt`. If the hold expires, booking controls are disabled and the guest is informed with a clear expiration message.

### 4. Demo Payment Simulation (`DemoPaymentModal`)
- **Mandatory Simulation Notice:** Displays a prominent, transparent banner clarifying that payment processing is a demonstration simulation and no real credit card charges occur.
- **Dual Flow Verification:**
  - **Simulated Failure:** Selecting "Simulate Decline" displays an error alert and **never calls the confirm API**, preserving hold invariants.
  - **Simulated Success:** Selecting "Simulate Success" calls `POST /api/bookings/{reference}/confirm` with the guest email, transitioning the booking to `CONFIRMED`.
- **Confirmation Ticket:** Displays a print-ready confirmation ticket with booking reference, guest details, room number, stay dates, and total amount.

### 5. Booking Management & Cancellation (`ManageBookingPage`)
- **Lookup Protection:** Requires both booking reference (`HB-XXXXXX`) and guest email. Unknown references and email mismatches return uniform 404 responses to prevent reference enumeration.
- **Cancellation Policy (`CAN-04`):** Guests can cancel a `HELD` or `CONFIRMED` booking before check-in. Once the check-in date has arrived or passed, cancellation is disallowed and a "Cancellation Period Lapsed" notice is displayed.
- **Accessible Confirmation Dialog:** Cancelling requires confirming in a modal dialog with focus management; dismissing the dialog aborts cancellation without triggering API calls.

---

## 6. Core Architecture & Design Assumptions

As documented in `docs/01-final-design.md`:

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

## 7. API Summary & Error Contract

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
All error responses strictly adhere to the unified JSON error format:
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

---

## 8. Verification & Quality Audits

- **Backend Test Suite:** 99/99 automated tests passing (`mvn test`).
- **Database Invariants:** 10/10 data invariants verified against MySQL 8 (`db/audit/invariants.sql`).
- **Frontend Test Suite:** 98/98 unit & integration tests passing across 10 suites (`npm test`).
- **Production Build:** Vite bundle built cleanly in ~21s with zero warnings (`npm run build`).
- **Audit Reports:** Detailed audit reports and screenshots located in `audits/`.

---

## 9. AI Tools Used

- **Antigravity:** Testing and Code review
- **Claude:** Verification improvement, High level design
- **ChatGPT:** Exploratory architecture design and development assistance
