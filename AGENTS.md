# Hotel Booking Portal - agent instructions (read first, every session)

Project: interview assignment, phase 1 = BACKEND ONLY (Java + Spring Boot + MySQL 8). Owner: Nitin.
The design is FROZEN. Your job is to implement it exactly, prove it with real tests and audits, and commit cleanly.

## Source of truth (highest first)
1. docs/00-assignment-verbatim.md   2. docs/01-final-design.md, db/schema.sql, docs/02-api-contract.md, docs/03-flows.md
3. docs/DECISIONS.md   4. docs/04-build-plan.md, docs/05-test-plan.md, docs/06-audit-checklist.md   5. everything else.
If sources conflict, or are silent on something you need: STOP and use the raise-blocker skill. Do not pick silently.

## Non-negotiables (details in .agents/rules/)
- No assumptions. No fabrication. Never claim a command ran, a test passed, a version or a behaviour unless you ran or verified it
  in this session and can show the output. Label anything unverified as NOT VERIFIED.
- Never fake, seed, hard-code or special-case results to make tests or audits look green. Never weaken, skip or delete a test.
- Do not change frozen files (db/schema.sql, docs/00-03) without an approved change request.
- Work step by step per docs/04-build-plan.md. Plan first, get approval, then implement, then verify, then STOP and report.
- Commit early and often with clean Conventional Commits (skill: clean-commit). Never push. Never use force, reset --hard or history rewriting.
- No deployments, no CI/CD, no cloud, no Docker publishing, no remote operations of any kind.
- No secrets in the repo. Credentials only from environment variables.
- Tests that touch bookings run against a real MySQL 8 database whose name ends with `_test`. Never against the dev DB.

## How to work
- Start with the `/start` workflow. Then `/build-step`, `/audit`, `/status`.
- Skills in .agents/skills/: spec-conformance, clean-commit, booking-concurrency-testing, backend-audit, raise-blocker, sample-data-authoring.
- Record real results in docs/BUILD_LOG.md and docs/TRACEABILITY.md. Audits go in audits/.
- Backend code lives in `backend/` (pending Q-08). Keep answers and reports short, factual and evidence-based.
