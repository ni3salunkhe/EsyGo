# Hotel Booking Portal - Backend (Phase 1)

A robust hotel booking REST API built with Java 17, Spring Boot, and MySQL 8.

---

## 1. Prerequisites

- **Java Development Kit (JDK):** Version 17 LTS (e.g. Eclipse Adoptium Temurin 17)
- **Build Tool:** Apache Maven 3.9+ (or Maven Wrapper)
- **Database:** MySQL 8.0.16+ (MySQL 8.0.46 Community Server tested)
- **Git & Bash:** Git 2.40+ (Git Bash on Windows for helper shell scripts)

---

## 2. Database Setup Instructions

The portal requires two databases on MySQL 8:
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

Credentials must be supplied exclusively via environment variables (never committed to repository):

Create a local `.env` file in the project root (ignored by git):

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

## 3. Building and Running

### Run the Application

```bash
cd backend
mvn spring-boot:run
```

On startup, `InventoryInitializer` automatically tops up 365 days of `room_night` inventory for all physical rooms using idempotent `INSERT IGNORE` queries.

### Run Automated Tests

Automated integration tests run against the test database `hotel_booking_test`:

```bash
cd backend
mvn clean test
```

### Verify Invariants

Run the invariant verification script against the populated database:

```bash
# Set environment variables for the verification script
export DB_NAME="hotel_booking"
export DB_USER="hotel_user"
export DB_PASSWORD="change_me_secure_password"

bash scripts/verify-invariants.sh
```

---

## 4. Key Design Assumptions

1. **Half-Open Stay Semantics:** A stay is defined as `[check_in, check_out)`. Check-out day is not an occupied night; back-to-back stays on the same room do not conflict.
2. **Room Category & Multi-Room:** Exactly one room category per hotel; one booking reserves exactly one room.
3. **10-Minute Hold (Surprise Feature):** Upon reservation (`POST /api/bookings`), rooms are held in status `HELD` / `RESERVED` for 10 minutes with `expiresAt`. Confirmation converts the hold to `CONFIRMED` / `BOOKED`. Expired holds are released by a 60-second scheduled background job.
4. **Window & Max Nights:** Inventory window is 365 days; maximum stay length is 30 nights.
5. **Cancellations:** Allowed only before the stay starts (`check_in > today`). Releases reserved room nights immediately.
6. **No User Accounts:** Guest authentication for retrieve and cancel uses `booking.reference` + `guest_email`.
7. **Monetary Precision:** All prices and totals use `DECIMAL(10,2)` in MySQL and `BigDecimal` in Java. Totals are calculated strictly on the backend.
