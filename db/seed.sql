-- ============================================================================
-- Hotel Booking Portal - Deterministic Sample Data (db/seed.sql)
-- Adheres to .agents/skills/sample-data-authoring/SKILL.md
-- NOTE: For demos and manual runs only. Tests construct their own data.
-- Does NOT contain bookings or room_night rows (room_nights are generated
-- idempotently by InventoryInitializer on application start).
-- ============================================================================

-- 1. Shared Amenities (8 items)
INSERT INTO amenity (id, name) VALUES
  (1, 'Wi-Fi'),
  (2, 'Swimming Pool'),
  (3, 'Free Parking'),
  (4, 'Complimentary Breakfast'),
  (5, 'Fitness Center'),
  (6, 'Air Conditioning'),
  (7, 'Multi-Cuisine Restaurant'),
  (8, 'Luxury Spa');

-- 2. Sample Hotels (5 hotels across 4 locations; 2 in Goa, differing prices)
-- Fictional names, realistic rates, image_url is strictly NULL (D-14)
INSERT INTO hotel (id, name, location, address, description, image_url, price_per_night) VALUES
  (1, 'Azure Bay Resort', 'Goa', '104 Calangute Beach Road, North Goa, 403516',
   'A tranquil beachfront sanctuary offering panoramic Arabian Sea vistas, lush gardens, and direct private beach access.',
   NULL, 4500.00),

  (2, 'Goa Palms Hideaway', 'Goa', '22 Vagator Cliff Path, Anjuna, Goa, 403509',
   'An intimate boutique escape surrounded by swaying palms, designed for quiet retreats and sunset contemplation.',
   NULL, 2800.00),

  (3, 'Marine Grand Suites', 'Mumbai', '78 Marine Drive, Nariman Point, Mumbai, 400021',
   'A prestigious city haven facing the iconic Queen''s Necklace, tailored for modern urban travellers and business executives.',
   NULL, 6200.00),

  (4, 'Heritage Haveli Palace', 'Jaipur', '15 Amber Fort Road, Pink City, Jaipur, 302001',
   'A grand royal residence celebrating regal Rajasthani architecture, ornate courtyard fountains, and timeless hospitality.',
   NULL, 5100.00),

  (5, 'Silicon Heights Inn', 'Bengaluru', '45 Indiranagar 100ft Road, Bengaluru, 560038',
   'A contemporary and vibrant tech-district hub with ergonomic modern spaces, curated local art, and artisan café dining.',
   NULL, 3700.00);

-- 3. Hotel Amenities (diverse associations)
-- Hotel 1 (Azure Bay Resort): Beach resort with pool, spa, breakfast, restaurant, wifi, ac
INSERT INTO hotel_amenity (hotel_id, amenity_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4), (1, 6), (1, 7), (1, 8);

-- Hotel 2 (Goa Palms Hideaway): Small boutique retreat (wifi, ac, parking, breakfast)
INSERT INTO hotel_amenity (hotel_id, amenity_id) VALUES
  (2, 1), (2, 3), (2, 4), (2, 6);

-- Hotel 3 (Marine Grand Suites): Luxury business hotel (wifi, ac, gym, restaurant, parking, breakfast)
INSERT INTO hotel_amenity (hotel_id, amenity_id) VALUES
  (3, 1), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7);

-- Hotel 4 (Heritage Haveli Palace): Heritage hotel (wifi, pool, restaurant, spa, ac, parking, breakfast)
INSERT INTO hotel_amenity (hotel_id, amenity_id) VALUES
  (4, 1), (4, 2), (4, 3), (4, 4), (4, 6), (4, 7), (4, 8);

-- Hotel 5 (Silicon Heights Inn): Contemporary city hotel (wifi, gym, ac, parking, breakfast)
INSERT INTO hotel_amenity (hotel_id, amenity_id) VALUES
  (5, 1), (5, 3), (5, 4), (5, 5), (5, 6);

-- 4. Physical Rooms (25 total rooms across 5 hotels)
-- Hotel 1 (Azure Bay Resort): 6 rooms
INSERT INTO room (id, hotel_id, room_number) VALUES
  (1, 1, '101'),
  (2, 1, '102'),
  (3, 1, '103'),
  (4, 1, '201'),
  (5, 1, '202'),
  (6, 1, '203');

-- Hotel 2 (Goa Palms Hideaway): 2 rooms (small hotel for easy manual sold-out verification)
INSERT INTO room (id, hotel_id, room_number) VALUES
  (7, 2, '101'),
  (8, 2, '102');

-- Hotel 3 (Marine Grand Suites): 8 rooms
INSERT INTO room (id, hotel_id, room_number) VALUES
  (9, 3, '101'),
  (10, 3, '102'),
  (11, 3, '103'),
  (12, 3, '104'),
  (13, 3, '201'),
  (14, 3, '202'),
  (15, 3, '203'),
  (16, 3, '204');

-- Hotel 4 (Heritage Haveli Palace): 5 rooms
INSERT INTO room (id, hotel_id, room_number) VALUES
  (17, 4, '101'),
  (18, 4, '102'),
  (19, 4, '103'),
  (20, 4, '201'),
  (21, 4, '202');

-- Hotel 5 (Silicon Heights Inn): 4 rooms
INSERT INTO room (id, hotel_id, room_number) VALUES
  (22, 5, '101'),
  (23, 5, '102'),
  (24, 5, '201'),
  (25, 5, '202');
