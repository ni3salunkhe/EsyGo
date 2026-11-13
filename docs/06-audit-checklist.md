# Audit checklist (used by the backend-audit skill / `/audit`)

Every item ends as PASS (with evidence: command + real output or file:line), FAIL (finding) or NOT RUN (say why). No other states.

## A. Spec conformance
A1 entities match db/schema.sql (`ddl-auto=validate` green, no entity-only columns). A2 every endpoint/field/status code matches docs/02.
A3 each flow's SQL matches docs/03 (guards present: status in WHERE, `reserved_until > NOW()` in confirm, half-open ranges).
A4 config properties match docs/01 section 8. A5 nothing outside scope was built (no auth, payment, admin, extra endpoints, extra tables).
A6 docs/TRACEABILITY.md rows are filled with real test names and results. A7 `bash scripts/check-frozen.sh` passes (frozen files unchanged) or every change has an approved CR and regenerated hashes.

## B. Data integrity
B1 `scripts/verify-invariants.sh` passes after the full suite. B2 negative proof: corrupt a copy of the data on purpose and show the matching INV fails.
B3 money is BigDecimal/DECIMAL everywhere (grep for float/double). B4 no entity exposed directly in API responses.

## C. Concurrency
C1 CONC-01..05 pass in 10 consecutive runs. C2 no read-check-write transitions in Java (review every status change). C3 retry wrapper is a separate bean.
C4 isolation level unchanged; no `synchronized`/in-memory locks used as the correctness mechanism. C5 row-lock order (room_id, stay_date) preserved.

## D. Security and secrets
D1 no secrets in tracked files or git history. D2 `.env` ignored. D3 queries parameterized (no string-concatenated SQL).
D4 errors leak no internals. D5 guest emails not logged. D6 reference-vs-email lookups do not reveal which part was wrong.
D7 dependency list contains only approved libraries; versions pinned and recorded.

## E. Validation and error handling
E1 every rule in docs/02 section 8 has a test. E2 one error body shape everywhere. E3 unexpected exceptions become INTERNAL_ERROR without details.

## F. Code quality
F1 layering respected (controllers thin, services own rules, repositories own SQL). F2 no dead code, TODOs, commented-out code, placeholder returns.
F3 no test-only branches in production code. F4 names/packages clear; no giant classes.

## G. Test quality (anti-vacuous checks)
G1 no @Disabled/@Ignore/skipped tests; no weakened assertions in git history of tests. G2 tests assert DB state.
G3 MUTATION SPOT-CHECKS - for each, apply the temporary break, run the named tests, show they FAIL, revert with git, show clean tree and green:
  M1 remove `AND status = 'AVAILABLE'` from the reserve claim -> CONC-01 must fail.
  M2 remove `AND reserved_until > NOW()` from confirm -> CNF-04 must fail.
  M3 change `stay_date < :out` to `<=` -> SRC-04 and PRC/RES price tests must fail.
  M4 remove the `status IN ('HELD','CONFIRMED')` guard in cancel -> CAN-03/CONC-04 must fail.
  M5 skip the partial-claim revert -> RES-03 must fail.
G4 suite run 10 times: report pass counts (any flake is a finding).

## H. Reproducibility
H1 following README literally on an EMPTY database reproduces schema + seed + app start + tests. H2 setup instructions contain no real secrets.

## I. Git hygiene
I1 history is clean Conventional Commits, each commit builds and passes tests. I2 no secrets/build output committed. I3 nothing was pushed. I4 steps are tagged.
