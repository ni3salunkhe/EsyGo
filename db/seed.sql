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

-- 5. Hotel Gallery Images (multiple images per hotel)
INSERT INTO hotel_image (hotel_id, image_url, caption, display_order, is_primary) VALUES
  (1, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', 'Beachfront view', 1, TRUE),
  (1, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', 'Resort swimming pool', 2, FALSE),
  (1, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', 'Luxury suite bedroom', 3, FALSE),

  (2, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80', 'Palms hideaway exterior', 1, TRUE),
  (2, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', 'Garden walkway', 2, FALSE),
  (2, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80', 'Boutique bedroom interior', 3, FALSE),

  (3, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80', 'Grand facade at night', 1, TRUE),
  (3, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', 'Executive suite lounge', 2, FALSE),
  (3, 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80', 'Skyline rooftop terrace', 3, FALSE),

  (4, 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1200&q=80', 'Heritage palace courtyard', 1, TRUE),
  (4, 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=1200&q=80', 'Royal Rajasthani suite', 2, FALSE),
  (4, 'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=1200&q=80', 'Traditional fountain patio', 3, FALSE),

  (5, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80', 'Contemporary modern facade', 1, TRUE),
  (5, 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80', 'Design interior lobby', 2, FALSE),
  (5, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80', 'Ergonomic urban room', 3, FALSE);
