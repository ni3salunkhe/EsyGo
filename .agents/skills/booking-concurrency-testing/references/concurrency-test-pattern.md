# Pattern (language-level outline; write real code against the approved Java/Spring versions)

1. `ExecutorService pool = fixed N threads`; `CountDownLatch ready(N)`, `CountDownLatch go(1)`.
2. Each task: `ready.countDown(); go.await(); try { return Outcome.success(service.reserve(request)); } catch (SoldOutException e) { return Outcome.soldOut(); }
   catch (ConcurrencyConflictException e) { return Outcome.conflict(); } catch (Throwable t) { return Outcome.unexpected(t); }`
3. Main: `ready.await(); go.countDown();` then collect futures with a generous timeout (fail the test on timeout - a hang is a bug).
4. Assertions use a histogram of outcomes, then SQL checks through a separate JDBC connection:
   - `SELECT COUNT(*) FROM booking WHERE status='HELD'` equals successes
   - `SELECT COUNT(*) FROM (SELECT room_id, stay_date FROM room_night WHERE booking_id IS NOT NULL GROUP BY room_id, stay_date HAVING COUNT(*) > 1) x` equals 0 (PK makes this trivial - the real value is in INV-01/02/05)
   - run db/audit/invariants.sql; every violations = 0.
5. Scenarios (docs/05): identical range (exact count), mixed overlapping + back-to-back (only 201/409, invariants hold; winner count may vary because
   allocation is first-come), confirm-vs-expiry at the deadline, concurrent cancels, concurrent confirms.
6. Staging confirm-vs-expiry: reserve, set `reserved_until = NOW() + INTERVAL 1 SECOND` directly in the DB, then fire confirm and the expiry job together.
   Accept either winner but require exactly one coherent end state and clean invariants.
7. Pitfalls seen in validation: occasional MySQL deadlock (error 1213 / SQLState 40001) under overlapping ranges -> handled by the single retry in a
   separate bean; a retry inside the same @Transactional bean does nothing; Spring may wrap the driver exception - catch the Spring translation and verify the class by running.
8. Keep each run independent: truncate in FK-safe order (room_night, booking, room, hotel_amenity, hotel, amenity) or recreate from db/schema.sql.
