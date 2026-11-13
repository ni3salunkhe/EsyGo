# Final design - Hotel Booking backend (FROZEN)

Provenance tags used in this pack:
- **[AGREED]**  settled with the project owner during design discussions.
- **[DERIVED]** follows directly from the assignment text (docs/00).
- **[DEFAULT]** a pack-author default the owner has not explicitly confirmed. Usable, but
  recorded in docs/DECISIONS.md and open to veto. Never extend this tag to anything else.
- **[AMENDMENT]** a defect found in the earlier discussion while validating this pack (section 10).

## 1. Scope
- Phase 1: backend only - Java + Spring Boot REST API + MySQL 8. [AGREED]
- Out of scope: authentication, payments (Stripe etc.), admin panel, cloud deployment, CI/CD,
  frontend (phase 2), multi-room bookings, room types, per-room amenities. [AGREED]
- One booking = exactly one room. One room category per hotel. [DERIVED]

## 2. Functional requirements
Browse hotels; search by location + check-in/check-out; view hotel details and availability for the
dates; reserve (hold) a room with name + email; see backend-calculated total before confirming;
confirm and receive a unique reference; retrieve by reference + email; cancel (releases availability).
Surprise feature: a 10-minute room hold with expiry (`expiresAt`) - see section 9. [AGREED]

## 3. Non-functional requirements [AGREED]
- Read-heavy (search/browse >> bookings); traffic spikes in festival seasons.
- Booking path: strong consistency. The same room-night is never held by two bookings.
- Search/detail path: low latency; slightly stale availability tolerated (booking re-checks at write time).
- Consistent API error format; backend validation; credentials never in the repo.

## 4. Entities and schema
Authoritative DDL: **db/schema.sql** (copy, do not retype). Entities: hotel, amenity, hotel_amenity,
room, room_night, booking.
- **hotel**: browse data + `price_per_night` (all rooms in a hotel cost the same). No `total_rooms`
  column - capacity is the count of `room` rows.
- **room**: a physical room (`room_number`). Carries NO availability status.
- **room_night**: one row per room per night. PK (room_id, stay_date) means a room-night can belong to
  at most one booking. `status` AVAILABLE/RESERVED/BOOKED, `booking_id`, `reserved_until` (per-row hold deadline).
- **booking**: `reference` (unique, e.g. HB-7K3Q9X), `room_id` (assigned room), guest name/email,
  `check_in`/`check_out` (DATE), `nights`, price snapshot (`price_per_night`, `total_amount`),
  `status` HELD/CONFIRMED/CANCELLED/EXPIRED, `expires_at` (while HELD).
- Money is DECIMAL(10,2) in the DB and BigDecimal in Java. Never float/double.
- Reference format [DEFAULT]: `HB-` + 6 chars from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`
  (no 0/O/1/I/L), generated with SecureRandom; retry on unique-key collision.

## 5. State machines [AGREED]
```
room_night:  AVAILABLE --reserve--> RESERVED --confirm--> BOOKED
                  ^                    |                    |
                  +---- expire/cancel -+------- cancel -----+

booking:     HELD --confirm--> CONFIRMED --cancel--> CANCELLED
               +--cancel-----------------------------> CANCELLED
               +--expire--> EXPIRED
```
Every transition is ONE conditional `UPDATE ... WHERE status = <expected>` followed by a check of the
affected-row count. Never read-check-save in Java for a transition.

## 6. Stay semantics [AGREED]
A stay is the half-open range `[check_in, check_out)`: the check-out night is NOT occupied, so
back-to-back stays on one room do not conflict. `nights = check_out - check_in` (days).
A room is bookable for a stay only if ALL its nights in the range are AVAILABLE.

## 7. Invariants
Executable form: **db/audit/invariants.sql** (INV-01..INV-10), run via scripts/verify-invariants.sh.
All must report violations = 0 after any test run. Validated on MySQL 8.0.46 (see section 10 / START_HERE.md).

## 8. Configuration (properties, overridable by environment)
| Property | Value | Tag |
|---|---|---|
| app.booking.hold-minutes | 10 | AGREED |
| app.expiry.fixed-delay-ms | 60000 (job runs every minute) | AGREED |
| app.booking.max-candidate-rooms | 5 | AGREED |
| app.inventory.window-days | 365 (bookable window; inventory seeded for [today, today+365)) | AGREED |
| app.booking.max-nights | 30 | DEFAULT |
| spring.jpa.hibernate.ddl-auto | validate (schema.sql is the source of truth; Hibernate never alters schema) | DEFAULT |
| spring.jpa.open-in-view | false | DEFAULT |
| DB_URL / DB_USERNAME / DB_PASSWORD | environment only | DERIVED (no secrets in repo) |
Clock rules [AGREED]: hold deadlines and expiry use the DATABASE clock (`NOW()`) everywhere. "Today" for date
validation uses an injectable `java.time.Clock` and a configured zone (see OPEN_QUESTIONS Q-06).
Inventory top-up [DEFAULT]: on application start, idempotently insert any missing room_night rows for
[today, today + window-days) for every room (`INSERT IGNORE`); no other scheduler.

## 9. Surprise feature - 10-minute room hold [AGREED]
What: after the guest enters name/email, the room is held for 10 minutes; response carries `expiresAt`
so the UI can show a countdown; the guest then confirms. Why: it removes the "someone else booked it
while I was deciding" problem and gives the consistency story a user-visible form. How: HELD booking +
RESERVED room-nights with `reserved_until`, conditional-UPDATE claims, confirm guarded by
`reserved_until > NOW()`, and a 60 s expiry job that releases lapsed holds.

## 10. Amendments found while validating this pack  [AMENDMENT]
- **A1 - reserve vs `booking.room_id NOT NULL`.** The earlier reserve flow inserted the booking before a
  room was chosen, which `room_id NOT NULL` + the `room_night.booking_id` FK make impossible. Resolution
  (schema unchanged): insert the booking with the FIRST candidate room's id; on a failed claim revert the
  partial claim by `booking_id`, set `booking.room_id` to the next candidate and retry; if none succeed,
  throw SoldOut so the whole transaction (including the booking insert) rolls back. See docs/03-flows.md.
- **A2 - deadlocks are real.** Concurrent overlapping reserves on MySQL 8 produced `ERROR 1213 (40001)
  deadlock` in about 4 of 960 contended requests during validation. The agreed "retry the reserve once"
  rule is therefore mandatory. After the retry also fails -> 409 `CONCURRENCY_CONFLICT` [DEFAULT].
- **A3 - `expires_at` semantics.** Confirm clears it; cancel and expiry leave it as-is. INV-08 encodes this.

## 11. Assumptions to state in the final write-up (README)
Half-open stay ranges; one room per booking; 10-minute holds; 365-day bookable window; max stay length;
confirm means the guest accepts the total (no payment); no cancellation once check-in day has started;
availability shown to search may lag the expiry job by up to ~1 minute; guest identity = reference + email
(no accounts); single currency, amounts are plain decimals.
