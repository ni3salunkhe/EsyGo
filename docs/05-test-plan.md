# Test plan - required tests (IDs are referenced from TRACEABILITY.md and audits)

Rules: .agents/rules/40-testing-and-audit.md. Tests assert DATABASE STATE, not just HTTP codes. Booking/availability tests run
against a REAL MySQL 8 test database (name ends `_test`), never H2/mocks. Tests create their own data and do not depend on seed.sql
(except DB-02). No test sleeps for the 10-minute hold; move `reserved_until`/`expires_at` in the DB instead.

## Unit (no database)
- PRC-01 total = nights x price (BigDecimal, scale 2) for 1, 2, 7, 30 nights; PRC-02 nights across month end, year end and a leap day.
- VAL-01 check-in in the past rejected; VAL-02 check-in today accepted; VAL-03 check-out == check-in rejected; VAL-04 check-out < check-in rejected;
  VAL-05 > max-nights rejected; VAL-06 beyond window rejected; VAL-07 blank/oversized name; VAL-08 malformed email; VAL-09 one date only (search).
  Each asserts the specific message/field.
- REF-01 format `HB-` + 6 chars from the allowed alphabet; REF-02 no excluded characters over 10,000 samples; REF-03 collision handled by retry.
- RETRY-01 retry wrapper retries exactly once on a deadlock exception and surfaces CONCURRENCY_CONFLICT on the second.

## Database / integration (real MySQL)
- DB-01 db/schema.sql applies to an empty DB and `ddl-auto=validate` passes. DB-02 seed.sql applies; >= 5 hotels, >= 3 locations, rooms exist.
- DB-03 InventoryInitializer creates exactly rooms x window-days rows and a second run adds 0. DB-04 test bootstrap refuses a DB not ending `_test`.
- T-REPO-* each guarded UPDATE: affected rows equals nights on success and 0 when any night is not AVAILABLE; partial-claim revert releases only that booking's rows.

## Search and detail
- SRC-01 filter by location (case-insensitive); SRC-02 excludes a hotel whose only room is held for the dates; SRC-03 excludes partial overlap;
  SRC-04 back-to-back (check-in == other stay's check-out) is available; SRC-05 `availableRooms` counts rooms, not nights;
  SRC-06 browse mode returns all hotels without availability fields; SRC-07 hotel detail with dates shows 0 when sold out (200, not 404);
  SRC-08 unknown hotel 404.

## Reserve / confirm / retrieve / cancel / expire
- RES-01 success: HELD, nights RESERVED, price snapshot, `expiresAt` ~ now+10 min; RES-02 sold out -> 409 and NO booking row and NO RESERVED nights left;
  RES-03 fallback: first candidate partially taken -> next candidate used; RES-04 invalid inputs -> 400 with field errors; RES-05 unknown hotel 404.
- CNF-01 success; CNF-02 idempotent; CNF-03 wrong email == unknown reference (identical 404 body); CNF-04 after deadline -> 409 HOLD_EXPIRED;
  CNF-05 CANCELLED/EXPIRED -> 409 INVALID_STATE.
- GET-01 retrieve by reference+email; GET-02 wrong email 404; GET-03 email case/whitespace tolerant.
- CAN-01 cancel HELD releases nights; CAN-02 cancel CONFIRMED releases nights and search offers the room again; CAN-03 idempotent;
  CAN-04 after check-in 409; CAN-05 EXPIRED 409; CAN-06 wrong email 404.
- EXP-01 expires only lapsed holds; EXP-02 leaves live holds and CONFIRMED bookings alone; EXP-03 idempotent; EXP-04 frees nights and sets EXPIRED.

## Concurrency (real MySQL, real threads, real transactions; repeat >= 10 times in the hardening step)
- CONC-01 N threads (N > rooms) book the identical range: exactly `rooms` successes, the rest SOLD_OUT, zero 500s, invariants hold.
- CONC-02 mixed overlapping/back-to-back ranges: only 201/409 outcomes, zero 500s, invariants hold (the exact winner count may legitimately vary).
- CONC-03 confirm vs expiry job at the deadline: exactly one outcome, invariants hold (best-effort timing; document how the race is staged).
- CONC-04 N concurrent cancels of one booking: nights released once, all responses 200. CONC-05 N concurrent confirms: one transition, all 200.

## API contract
- API-01 each error code returns the docs/02 body (all five fields, `fieldErrors` always an array). API-02 malformed JSON -> 400 VALIDATION_ERROR.
- API-03 unknown route -> 404 NOT_FOUND body. API-04 no stack trace/SQL/class names in any error body. API-05 JSON field names match docs/02 exactly.
- API-06 emails are not written to application logs.

## Repository hygiene
- SEC-01 no credentials in tracked files (scripted grep, output recorded). SEC-02 `.env` is ignored and absent from git history.
