# Build plan - backend phase (ordered; do not skip or reorder)

Each step: plan first (Implementation Plan artifact, wait for the owner's approval), implement in small commits,
run the step's tests for real, run the spec-conformance skill, update docs/BUILD_LOG.md and docs/TRACEABILITY.md
with evidence, tag `step-NN`, then STOP and report. Do not start the next step until told (`/build-step`).
Commit rules: .agents/rules/20-git-and-commits.md. Blockers: raise-blocker skill.

## Step 0 - Gate (`/start`)  - no application code yet
Do: read docs in the order in AGENTS.md; prove the rules/skills/workflows are loaded (list them with paths);
record real tool versions; get answers to docs/OPEN_QUESTIONS.md; init git (ask for identity if unset); first commits:
pack files as-is (`chore: add handover pack`) - never edit pack docs silently afterwards.
Exit: owner approved the written understanding + resolved open questions; DECISIONS.md updated; clean `git status`.

## Step 1 - Scaffold
Do: Spring Boot project in `backend/` (Web, Validation, Data JPA, MySQL driver, Test only; anything else needs approval);
layered packages (controller / service / repository / domain / dto / exception / config); property files from docs/01 section 8
reading DB settings from env; `.env.example` stays secret-free; a health/smoke endpoint is NOT required (do not invent endpoints).
Exit: app builds; app fails fast with a clear message when DB env vars are missing; `.gitignore` verified (no `.env`, no build output).

## Step 2 - Database
Do: `db/schema.sql` is already frozen - apply it, do not rewrite it. Write `db/seed.sql` per the sample-data-authoring skill,
the idempotent InventoryInitializer (docs/01 section 8), DB setup instructions (create DB + user, apply schema, apply seed, env vars) in README.md,
and a test-DB bootstrap that DROPS and re-creates tables from `db/schema.sql` and refuses to run unless the DB name ends with `_test`.
Exit: DB-01..DB-04 pass; `scripts/verify-invariants.sh` passes on the seeded DB; instructions verified by following them literally on an empty DB.

## Step 3 - Domain and repositories
Do: entities mapped to the frozen schema (`ddl-auto=validate` must pass); repositories; the conditional-UPDATE statements from docs/03
as repository methods; decide JPA-vs-JdbcTemplate for them in the plan and document why.
Exit: repository tests on real MySQL prove each guarded UPDATE's affected-row behaviour (T-REPO-*).

## Step 4 - Pricing, validation, reference generator (pure unit tests)
Do: nights/total calculation (BigDecimal), request validation per docs/02 section 8, reference generator, injectable Clock.
Exit: PRC-*, VAL-*, REF-* pass. (Mid-point audit after step 5: run `/audit`.)

## Step 5 - Browse, search, hotel detail
Exit: SRC-* pass incl. partial-overlap and back-to-back cases; query matches docs/03 semantics; API contract tests for these endpoints.

## Step 6 - Reserve (the hold)
Exit: RES-* and CONC-01/CONC-02 pass; deadlock-retry wrapper exists as a separate bean and has a test (simulated deadlock exception is
acceptable ONLY for the wrapper's unit test; the real-DB race tests must still run against real MySQL).

## Step 7 - Confirm, retrieve, cancel
Exit: CNF-*, CAN-*, GET-* and CONC-04/CONC-05 pass.

## Step 8 - Expiry job
Exit: EXP-* pass; CONC-03 (confirm vs expiry race) runs; `scripts/verify-invariants.sh` passes after the whole suite.

## Step 9 - Error handling and contract
Exit: API-* pass: every error code produces the exact body in docs/02 section 7; no stack traces/SQL in responses; consistent field names.

## Step 10 - Hardening, write-up, final audit
Do: run the full suite 10 times (flakiness is a bug); mutation spot-checks (docs/06 section G); README: setup, run, test, assumptions
(docs/01 section 11), surprise-feature write-up (what/why/how); complete docs/TRACEABILITY.md with evidence; final `/audit`.
Exit: audit report with zero unresolved critical/high findings, or each remaining finding listed for the owner; tag `backend-complete`.
Frontend (React) is phase 2 and is NOT started in this plan.
