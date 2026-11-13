# Rule: backend engineering standards

## Structure
Layered packages under the base package: controller (thin: HTTP only), service (business rules, transactions), repository (SQL/JPA),
domain (entities, enums), dto (request/response records), exception (domain exceptions + the @RestControllerAdvice), config.
Controllers never contain business rules or SQL. Entities are never returned from controllers. Constructor injection only.

## Database access
- db/schema.sql is the source of truth. `spring.jpa.hibernate.ddl-auto=validate`; Hibernate must never create or alter tables.
- Every state transition is ONE conditional UPDATE (status in the WHERE clause) with the affected-row count checked - see docs/03.
  Never read a status, check it in Java, then save. Never use in-memory locks (`synchronized`, concurrent maps) as the correctness mechanism.
- Use parameterized statements only; never build SQL by string concatenation.
- Money: BigDecimal in Java, DECIMAL(10,2) in MySQL. Never float/double. Compute totals only on the backend.
- Keep MySQL's default REPEATABLE READ; do not change isolation levels. Keep the lock order (room_id, stay_date) ascending.
- The deadlock retry lives in a separate bean (a retried @Transactional method called from within its own class is not retried transactionally).
- Time: hold deadlines and expiry use the database clock (`NOW()`); date validation uses an injectable `java.time.Clock`.

## API
Exactly the endpoints, fields, status codes and error body in docs/02. No extra endpoints, no renamed fields, no extra error codes.
`@RestControllerAdvice` maps every exception to the single error body. Unexpected exceptions -> 500 INTERNAL_ERROR with a generic message
(details only in server logs). Validate with Jakarta Bean Validation plus explicit domain checks; messages must name the field and the rule.

## Configuration and secrets
Properties per docs/01 section 8. DB settings come only from environment variables (DB_URL, DB_USERNAME, DB_PASSWORD; tests: TEST_DB_*).
Fail fast with a clear message if they are missing. `.env.example` has placeholders only. Never print, log or commit secrets.
Do not log guest emails or full URLs containing them.

## Code quality
Small classes and methods, intention-revealing names, no dead code, no commented-out code, no TODO placeholders, no placeholder return values,
no `System.out`, no catch-and-ignore. Java language features per the approved Java version only. No clever frameworks: boring and explicit wins.

## Seed and bootstrap
db/seed.sql follows the sample-data-authoring skill. The inventory top-up is idempotent. Neither runs inside tests unless the test is DB-02/DB-03.
