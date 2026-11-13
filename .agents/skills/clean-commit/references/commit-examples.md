# Commit message examples

```
feat(booking): reserve a room with a 10-minute hold

Insert a HELD booking with the first candidate room and claim its nights with
one guarded UPDATE; revert partial claims by booking_id and try the next
candidate (design amendment A1). Throws SoldOut when none can be claimed so
the transaction rolls back completely.

Verified: mvn test -Dtest=ReserveIT -> 6 tests, 0 failures
Refs: step-06
```
```
test(booking): race 12 threads for the last two rooms

Asserts exactly 2 successes, 10 SOLD_OUT, zero 5xx, and invariants INV-01..10.

Verified: ran 10 times, 10/10 green
Refs: step-06
```
```
db(schema): apply frozen schema in the test bootstrap

Refuses to run unless the database name ends with _test.
Refs: step-02
```
```
docs(audit): add AUDIT-20261201-1 for steps 1-5
```
Bad: "wip", "fix stuff", "update", "final version", "changes", "tests pass" (without having run them).
