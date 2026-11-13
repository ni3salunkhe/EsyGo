# Conformance matrix (design side -> what to inspect/run)

| Area | Design source | Implementation to inspect | Real check |
|---|---|---|---|
| Tables/columns/keys/indexes | db/schema.sql | JPA entities, repositories | schema-validation test (DB-01) green with ddl-auto=validate; no entity-only columns |
| Status values | docs/01 s5 | enums/constants | grep every status literal; only the listed values exist |
| Endpoints, methods, paths | docs/02 | controllers | contract tests API-*; no extra mappings (grep `@*Mapping`) |
| JSON field names, optional-field rules | docs/02 | DTO records | API-05; dates-only fields omitted without dates |
| Error codes/HTTP statuses/body | docs/02 s7 | advice class, exceptions | API-01..04 |
| Validation rules | docs/02 s8 | validators/DTO annotations | VAL-* |
| Search query semantics | docs/03 search | repository query | SRC-01..08 incl. SRC-03/SRC-04 |
| Reserve flow incl. A1 candidate handling and revert | docs/03 reserve | service + repository | RES-01..03, CONC-01/02 |
| Confirm guard `reserved_until > NOW()` | docs/03 confirm | repository statement | CNF-04 |
| Cancel guards and idempotency | docs/03 cancel | repository/service | CAN-*, CONC-04 |
| Expiry job statements, cadence, per-row deadline | docs/03 expiry | scheduler class | EXP-*; property app.expiry.fixed-delay-ms |
| Retry once on deadlock, separate bean | docs/03 pitfalls | facade/wrapper bean | RETRY-01 |
| Config properties and defaults | docs/01 s8 | application properties | read the property file; no secrets inside |
| Clock/time rules | docs/01 s8 | Clock bean, SQL NOW() usage | timestamp round-trip test |
| Invariants | db/audit/invariants.sql | n/a | scripts/verify-invariants.sh PASS with non-empty data |
| Scope | rule 00 | whole repo | nothing outside docs/01 s1 was built |
