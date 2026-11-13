-- ============================================================================
-- Hotel Booking Portal - authoritative MySQL 8 schema (FROZEN by the design)
-- Source of truth: docs/01-final-design.md section 4. Do not edit without an
-- approved change request (see .agents/rules/00-project-scope.md).
-- Create the database separately (name comes from configuration), then run
-- this file against it. Requires MySQL 8.0.16+ (CHECK constraints enforced).
-- ============================================================================

CREATE TABLE hotel (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(50) NOT NULL,
  address VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  price_per_night DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hotel_location (location)
);

CREATE TABLE amenity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE hotel_amenity (
  hotel_id BIGINT NOT NULL,
  amenity_id INT NOT NULL,
  PRIMARY KEY (hotel_id, amenity_id),
  FOREIGN KEY (hotel_id) REFERENCES hotel(id),
  FOREIGN KEY (amenity_id) REFERENCES amenity(id)
);

CREATE TABLE room (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  hotel_id BIGINT NOT NULL,
  room_number VARCHAR(10) NOT NULL,
  UNIQUE (hotel_id, room_number),
  FOREIGN KEY (hotel_id) REFERENCES hotel(id)
);

CREATE TABLE booking (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(12) NOT NULL UNIQUE,
  hotel_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  guest_name VARCHAR(100) NOT NULL,
  guest_email VARCHAR(150) NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INT NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(10) NOT NULL,          -- HELD, CONFIRMED, CANCELLED, EXPIRED
  expires_at TIMESTAMP NULL,            -- only meaningful while HELD
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotel(id),
  FOREIGN KEY (room_id) REFERENCES room(id),
  CHECK (check_out > check_in)
);

CREATE TABLE room_night (
  room_id BIGINT NOT NULL,
  stay_date DATE NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'AVAILABLE',  -- AVAILABLE, RESERVED, BOOKED
  booking_id BIGINT NULL,
  reserved_until TIMESTAMP NULL,
  PRIMARY KEY (room_id, stay_date),
  FOREIGN KEY (room_id) REFERENCES room(id),
  FOREIGN KEY (booking_id) REFERENCES booking(id),
  INDEX idx_rn_booking (booking_id),
  INDEX idx_rn_expiry (status, reserved_until)
);
