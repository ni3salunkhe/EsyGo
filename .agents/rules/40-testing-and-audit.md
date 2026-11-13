# Rule: testing, evidence and audits

## Tests
- The required test set is docs/05-test-plan.md. Implement those IDs and name tests with the ID (e.g. `CONC_01_identicalRange_exactlyRoomsSucceed`).
- Unit tests for pure logic (pricing, validation, reference). Integration tests for everything involving SQL, state or concurrency, on a real
  MySQL 8 test DB (name ends `_test`; the test bootstrap must refuse any other name). Schema for tests comes from db/schema.sql.
- Assert database state (rows, statuses, counts), not just HTTP codes or return values.
- Concurrency tests use real threads and real transactions (skill: booking-concurrency-testing). Repeat them 10 times in the hardening step.
- Never sleep to simulate the 10-minute hold: change `reserved_until`/`expires_at` in the DB. No sleeps longer than 1 second in any test.
- After the suite: run scripts/verify-invariants.sh; it must PASS. Remember an empty database also passes - assert preconditions (rows exist).

## Definition of done for a step
1. All tests listed for the step in docs/04 exist and PASS in a real run you can show. 2. The whole existing suite is green.
3. The spec-conformance skill reports no deviations. 4. scripts/verify-invariants.sh passes. 5. Everything is committed with clean commits.
6. docs/BUILD_LOG.md and docs/TRACEABILITY.md updated with real evidence. 7. The owner has the report. Then STOP.

## Reporting format (every step report and every status)
`Done:` what changed (commits). `Verified:` exact commands + real results. `Not verified:` what and why. `Deviations:` none or list with approvals.
`Blocked/Questions:` numbered. No marketing language, no unverified superlatives.

## Audits
Run `/audit` after steps 5, 8 and 10 and whenever the owner asks. Follow the backend-audit skill and docs/06-audit-checklist.md. An audit is evidence,
not a formality: every item PASS (with evidence), FAIL, or NOT RUN. Fix findings in separate, clearly named commits and re-audit the affected items.
Never edit an audit report after the fact; write a new one.
