# Decisions log

Rule: the agent may use AGREED / DERIVED / DEFAULT items without asking. DEFAULT items are open to veto by the owner at any time.
Anything NOT listed here and not in docs/01-03 is undecided: use the raise-blocker skill. Append new decisions at the bottom with date,
who decided (owner name or "owner approved in chat"), and the evidence/reason. Never edit an old row - add a superseding row.

| ID | Decision | Tag | Source |
|---|---|---|---|
| D-01 | Backend first: Spring Boot + MySQL 8; React frontend is phase 2 | AGREED | owner request |
| D-02 | Schema = db/schema.sql (room_night per-night status model); no Flyway/Liquibase; `ddl-auto=validate` | AGREED (schema) / DEFAULT (no migration tool, validate) | design discussion |
| D-03 | Half-open stays `[check_in, check_out)`; one room per booking; one room category per hotel | AGREED | design discussion |
| D-04 | 10-minute hold, 60 s expiry job, 5 candidate rooms, 365-day window | AGREED | design discussion |
| D-05 | Reserve retries once on deadlock; then CONCURRENCY_CONFLICT (409) | AGREED (retry once) / DEFAULT (error code) | design + validation A2 |
| D-06 | Booking insert uses first candidate's room_id, reassigned on retry (amendment A1) | AMENDMENT | pack validation |
| D-07 | Confirm clears `expires_at`; cancel/expire leave it (A3) | AMENDMENT | pack validation |
| D-08 | API as in docs/02; browse mode when no dates are given | AGREED (endpoints) / DEFAULT (browse semantics, case-insensitive exact location match, ordering by name) | design + assignment req. 1 |
| D-09 | Reference format `HB-` + 6 chars from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` | DEFAULT | pack author |
| D-10 | max nights 30; email trimmed + lower-cased; instants as ISO-8601 UTC | DEFAULT | pack author |
| D-11 | Inventory top-up only at application start (idempotent INSERT IGNORE) | DEFAULT | pack author |
| D-12 | Tests: real MySQL 8 test DB whose name ends `_test` (env: TEST_DB_URL/TEST_DB_USERNAME/TEST_DB_PASSWORD); no H2; no Testcontainers unless approved | DEFAULT | pack author |
| D-13 | Libraries: Spring Web, Validation, Data JPA, MySQL driver, Spring Boot Test only. No Lombok, no OpenAPI, no migration tools unless approved | DEFAULT | pack author |
| D-14 | Seed image URLs are NULL (no invented URLs) | DEFAULT | pack author |
| D-15 | No deployments, no CI/CD, no pushing, no remote git operations | AGREED | owner request |
