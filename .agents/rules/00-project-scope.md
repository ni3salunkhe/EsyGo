# Rule: project scope and the frozen design

## What is being built
A hotel booking REST backend for an interview assignment (docs/00). Stack: Java, Spring Boot, MySQL 8, REST/JSON.
Phase 1 is backend only. The React frontend is phase 2 and must NOT be started, scaffolded or stubbed now.

## Explicitly out of scope (do not build, do not "prepare for")
Authentication/authorization, payments (including Stripe), admin panel, multi-room bookings, room types, per-room amenities,
user accounts, cloud deployment, CI/CD pipelines, Docker/Kubernetes deployment artifacts, caching layers, message queues,
extra endpoints, extra tables, extra "nice to have" features. If you think something is missing, raise it - do not add it.

## Frozen files
db/schema.sql, docs/00-assignment-verbatim.md, docs/01-final-design.md, docs/02-api-contract.md, docs/03-flows.md, db/audit/invariants.sql.
Treat them as read-only. Allowed: reading, quoting, implementing exactly. Not allowed: "improving", reformatting, fixing typos in place.
Integrity is checked by `scripts/check-frozen.sh` (sha256 list in docs/FROZEN.sha256). Run it at /start, before every commit that touches docs/ or db/, and in every audit.

## Change protocol (the only way to deviate)
1. Stop work on the affected part. 2. Write docs/change-requests/CR-NNN.md: what, why, evidence (real output), impact on schema/API/tests,
options. 3. Ask the owner in chat and wait for an explicit "approved". 4. After approval: apply the change to the frozen file(s) in its own
commit `docs(design): <change> (CR-NNN)` that also regenerates docs/FROZEN.sha256, add a superseding row to docs/DECISIONS.md, then update code and tests.
Never implement first and document later. Never treat silence as approval.

## Dependencies
Only: Spring Boot starters web, validation, data-jpa; the MySQL JDBC driver; spring-boot-starter-test. Anything else needs approval via
the change protocol (no Lombok, no OpenAPI generators, no migration tools, no H2). Resolve versions from official sources
(start.spring.io / Maven Central / official docs) with a real lookup; record them in docs/DECISIONS.md. Never guess a version from memory.

## Source-of-truth conflicts
If the code, a test and the design disagree, the design wins; the code or test is wrong until the owner approves a change request.
