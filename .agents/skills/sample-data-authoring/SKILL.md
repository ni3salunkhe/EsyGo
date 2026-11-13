---
name: sample-data-authoring
description: "Authors the honest, deterministic sample data in db/seed.sql (hotels, amenities, rooms) and the idempotent inventory top-up for the hotel booking database. Use when creating or changing seed data, when the assignment's 'sample data for at least five hotels' is being implemented, or when demo data is needed for manual runs. Do not use to create data for tests - tests build their own data."
---

# Sample data authoring

Seed data is for demos and manual runs only. It must never be shaped to make a test, an audit or an invariant look good.

## Requirements (assignment: at least five hotels, one room category per hotel)
- At least 5 hotels in at least 3 locations, with at least two hotels in one location (so location search is meaningful).
- 4-10 rooms per hotel, with different counts, and at least one small hotel (2 rooms) so sold-out behaviour is easy to demonstrate manually.
- Realistic fictional names (do not use real hotel brands), 1-2 sentence descriptions, realistic `price_per_night` values that differ between hotels (plain decimals; no currency column).
- A shared amenity list of about 8 items (e.g. Wi-Fi, Pool, Parking, Breakfast, Gym, Air conditioning, Restaurant, Spa) linked via `hotel_amenity`; hotels differ in amenities.
- `image_url` stays NULL unless the owner supplies real images - never invent URLs.
- Rooms: `room_number` unique per hotel (e.g. 101..). No bookings and no room_night rows in seed.sql.

## Mechanics
- Plain SQL, readable, ordered by FK dependencies, deterministic (explicit ids or deterministic lookups), runnable once on an empty schema. State in a header comment that it is sample data.
- room_night rows come from the idempotent InventoryInitializer (docs/01 s8), not from seed.sql.
- After seeding, report the real counts (`SELECT COUNT(*)` per table) and run scripts/verify-invariants.sh. Do not paste invented output.
