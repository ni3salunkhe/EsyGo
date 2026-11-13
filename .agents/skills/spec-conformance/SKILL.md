---
name: spec-conformance
description: "Verifies that the implemented backend matches the frozen design (db/schema.sql, docs/02 API contract, docs/03 flows, state machines, config) and records evidence in docs/TRACEABILITY.md. Use when finishing a build step, before tagging a step, before an audit, or when asked whether the code matches the design or requirements. Do not use for style review or for writing new features."
---

# Spec conformance check

Goal: prove, with evidence, that code = design. Reading code is not evidence of behaviour; running tests and queries is.

## Procedure
1. Read docs/01, docs/02, docs/03, db/schema.sql and the step's section of docs/04. Read `references/conformance-matrix.md`.
2. For each row of the matrix, compare the design side with the implementation side and mark MATCH, DEVIATION or NOT BUILT YET (expected for later steps).
3. Run the real checks the matrix names (schema validation test, relevant tests, `scripts/verify-invariants.sh`). Record the exact command and result.
4. Update the matching rows in docs/TRACEABILITY.md: implementation file, test IDs, command + date + result, status. VERIFIED only with a passing real run.
5. Report: `MATCH n / DEVIATION n / NOT BUILT YET n`. For each DEVIATION: design reference, code location (file:line), why it matters.
6. Never "fix" a deviation by editing frozen docs. Either fix the code, or raise a change request (rule 00-project-scope).

## Output
A short table in the step report and updated TRACEABILITY.md rows. If any DEVIATION exists the step is not done.
