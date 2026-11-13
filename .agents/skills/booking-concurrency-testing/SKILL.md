---
name: booking-concurrency-testing
description: "Writes and runs real concurrency tests for the booking, cancel, confirm and expiry flows against a real MySQL 8 test database and checks the data invariants afterwards. Use when implementing or changing reserve, confirm, cancel, expiry or availability logic, when a test is flaky, when asked to prove that double booking cannot happen, or when running CONC-* tests. Do not use for pure unit tests of pricing or validation."
---

# Concurrency testing for the booking flows

Why: the core promise is that one room-night is never held by two bookings. Only real threads + real transactions + real MySQL can show it.
Read `references/concurrency-test-pattern.md` before writing a test.

## Procedure
1. Precondition: test DB name ends `_test`; tables rebuilt from db/schema.sql; create the test's own hotel/rooms/inventory. Assert the precondition rows exist
   (an empty database passes every invariant - never accept a vacuous pass).
2. Stage the race with a start latch so all threads call the service/API at the same instant; collect every outcome (success, SoldOut, ConcurrencyConflict, any other exception).
3. Assert: (a) outcome counts exactly as the scenario defines (identical ranges: exactly `rooms` successes); (b) ZERO unexpected exceptions/HTTP 5xx;
   (c) database state: every successful booking has exactly `nights` room_night rows with the right statuses, no room_night has two owners,
   (d) `scripts/verify-invariants.sh` (or the same SQL in the test) reports 0 violations.
4. Repeat the scenario in a loop (>= 10 runs in the hardening step) with fresh data each run. Report pass counts. One failure = a bug to root-cause, not to retry away.
5. Never mock the repository, never use H2, never replace locking with `synchronized`, never sleep to "make it pass".
6. If a deadlock error (MySQL 1213) escapes the retry wrapper in the real-DB race, that is a defect in the wrapper or the lock order - investigate, do not swallow it.

## Report
Scenario, thread count, rooms, runs, outcome histogram, invariant result, exact command.
