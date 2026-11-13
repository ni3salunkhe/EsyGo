# Flows (FROZEN) - exact statements and transaction rules

All SQL below is validated on MySQL 8.0.46 (REPEATABLE READ default). Names are the schema's names.
Parameters: `:in`/`:out` = check-in/check-out, `:nights` = out - in in days.

## Search / availability (read-only, no locks)
```sql
SELECT h.id, h.name, h.address, h.price_per_night, COUNT(*) AS available_rooms
FROM hotel h
JOIN (SELECT r.hotel_id, r.id AS room_id
      FROM room r JOIN room_night rn ON rn.room_id = r.id
      WHERE rn.stay_date >= :in AND rn.stay_date < :out AND rn.status = 'AVAILABLE'
      GROUP BY r.id, r.hotel_id
      HAVING COUNT(*) = :nights) ar ON ar.hotel_id = h.id
WHERE h.location = :loc          -- optional filter
GROUP BY h.id;
```
A room counts only if EVERY night in the range is AVAILABLE. Hotels with `available_rooms = 0` are omitted in search mode.

## Reserve  (one @Transactional unit; see "Spring pitfalls" for the retry wrapper)
1. Validate input (docs/02 section 8); load hotel (404). Compute `nights`, `total = nights x price` with BigDecimal.
2. Candidates: up to `max-candidate-rooms` rooms of that hotel, same subquery as search, `ORDER BY room_id LIMIT 5`.
   None -> throw SoldOut.
3. Insert booking: status HELD, `expires_at = NOW() + 10 min`, price snapshot, reference, `room_id = candidate[0]`  (A1).
4. For each candidate in order (for candidates after the first, first `UPDATE booking SET room_id = :cand WHERE id = :bid`):
```sql
UPDATE room_night
SET status = 'RESERVED', booking_id = :bid, reserved_until = NOW() + INTERVAL 10 MINUTE
WHERE room_id = :cand AND stay_date >= :in AND stay_date < :out AND status = 'AVAILABLE';
```
   - affected rows == nights -> claimed, stop.
   - otherwise another transaction took some nights: undo ONLY our partial claim and try the next candidate:
```sql
UPDATE room_night SET status = 'AVAILABLE', booking_id = NULL, reserved_until = NULL WHERE booking_id = :bid;
```
5. No candidate claimed -> throw SoldOut (rolls back everything, including the booking insert).
6. Return 201 DTO. On MySQL error 1213/SQLState 40001 (deadlock) retry the whole reserve ONCE; second failure -> CONCURRENCY_CONFLICT.
Row-lock order is always (room_id, stay_date) ascending, which keeps deadlocks rare - not impossible (A2).

## Confirm
1. Find booking by reference + normalized email (else 404). CONFIRMED -> return 200 as-is. CANCELLED/EXPIRED -> 409 INVALID_STATE.
2. `UPDATE room_night SET status='BOOKED', reserved_until=NULL WHERE booking_id=:bid AND status='RESERVED' AND reserved_until > NOW();`
   affected != nights -> throw HOLD_EXPIRED (transaction rolls back; the expiry job tidies up).
3. `UPDATE booking SET status='CONFIRMED', expires_at=NULL WHERE id=:bid AND status='HELD';` expect 1 row.

## Cancel
1. Find by reference + email (404). CANCELLED -> 200 idempotent. EXPIRED -> 409. `check_in <= today` -> 409 INVALID_STATE.
2. `UPDATE room_night SET status='AVAILABLE', booking_id=NULL, reserved_until=NULL WHERE booking_id=:bid;`
3. `UPDATE booking SET status='CANCELLED' WHERE id=:bid AND status IN ('HELD','CONFIRMED');`
   0 rows here means a concurrent cancel won -> return the current state, never double-release.

## Expiry job  (`@Scheduled(fixedDelayString=...)`, every 60 s, ONE transaction, idempotent, safe on several instances)
```sql
UPDATE room_night SET status='AVAILABLE', booking_id=NULL, reserved_until=NULL
WHERE status='RESERVED' AND reserved_until < NOW();
UPDATE booking SET status='EXPIRED' WHERE status='HELD' AND expires_at < NOW();
```
Per-row deadlines mean a hold made one minute ago is never released early. Confirm checks `reserved_until > NOW()` itself,
so confirm and the job cannot both win. A lapsed room may stay hidden from search for up to ~1 minute.

## Spring / JDBC pitfalls (each one is a test or audit item)
- **Retry wrapper:** a `@Transactional` method retried from inside the same bean is NOT retried transactionally
  (proxy self-invocation). Put the retry in a separate bean/facade that calls the transactional service method.
  Catch Spring's deadlock/lock-acquisition exceptions there (and verify the exact exception class against the running driver).
- **Persistence-context staleness:** after bulk `@Modifying` queries the JPA context is stale. Either use
  `NamedParameterJdbcTemplate`/native `@Modifying(flushAutomatically = true, clearAutomatically = true)`, or never re-read the
  same rows through entities in that transaction. Decide in the Implementation Plan and prove it with a test.
- **Affected-row counts:** the guard logic relies on the affected-row count. Verify what the driver/URL settings return and prove
  it with a test (our statements change every row they match, so changed == matched).
- **Timestamps/time zones:** `expires_at`/`reserved_until` are TIMESTAMP. Prove with a round-trip test that `expiresAt` in the API
  equals DB time + 10 minutes (UTC, small tolerance) under the configured connection settings.
- **Tests must not sleep 10 minutes:** simulate time passing by updating `reserved_until`/`expires_at` in the DB.
- **Isolation:** default REPEATABLE READ is what these statements were validated under. Do not change isolation levels.
