# START HERE - Antigravity handover pack: Hotel Booking backend (Spring Boot + MySQL)

For: Nitin. Phase 1 = backend only. The design from our discussion is frozen into this pack so the agent implements it exactly,
proves it with real tests and audits, and commits cleanly. No deployment, no CI/CD, no pushing.

## 1. Install
1. Create a NEW empty folder for the project (this folder becomes the git repo root).
2. Copy the CONTENTS of this pack into it - including the hidden `.agents/` folder, `.gitignore` and `.env.example`.
3. Open that folder as a workspace in Antigravity.
4. Have MySQL 8.0.16+ ready (local install or Docker): one empty dev database and one empty test database whose NAME ENDS WITH `_test`.
   Tests drop and recreate tables in the test DB, so never point them at real data. Credentials go in environment variables, never in files.
5. The helper scripts are bash. On Windows use WSL or Git Bash (the agent will ask - Q-01).

## 2. Antigravity settings to check yourself (the pack cannot set these)
Names differ between versions; look for the equivalents.
- Terminal command execution: use the "request review"/allow-list mode, NOT "always proceed". Deny list: `git push`, `git reset`, `git clean`, `git rebase`, `rm -rf`.
  Allow list: `git status|diff|add|commit|log|tag`, the build tool's test/build commands, `mysql`, `bash scripts/*.sh`.
- Review policy: request review for Implementation Plans so the agent waits for your approval before coding.
- Keep access to files outside the workspace off.

## 3. How the pack is wired (Antigravity conventions)
- `AGENTS.md` (root) - short non-negotiables, read every session.
- `.agents/rules/` - five always-on rules: scope and frozen design, no assumptions/no fabrication, git and clean commits, backend standards, testing and audit.
- `.agents/skills/` - six on-demand skills the agent loads by their descriptions: spec-conformance, clean-commit, booking-concurrency-testing, backend-audit, raise-blocker, sample-data-authoring.
- `.agents/workflows/` - slash commands: `/start`, `/build-step`, `/audit`, `/status`.
- `docs/` - the frozen design (00-03), the build plan, test plan, audit checklist, decisions, open questions, traceability matrix, build log.
- `db/schema.sql` - frozen schema. `db/audit/invariants.sql` + `scripts/verify-invariants.sh` - data-integrity checks. `scripts/check-frozen.sh` - detects edits to frozen files.
If your Antigravity version does not pick up `.agents/` (older builds used `.agent/`), the agent must tell you in `/start`; then rename the folder to `.agent` and re-run `/start`.

## 4. Run it
1. In Antigravity paste: `Run /start. Follow AGENTS.md and .agents/rules. Do not write application code yet.`
2. Answer the numbered questions it asks (they mirror `docs/OPEN_QUESTIONS.md`: OS, MySQL access, Maven or Gradle, Java version, git identity, time zone, package name, folder layout).
3. Then, one step at a time: `/build-step`. It writes an Implementation Plan first - read it, then reply "approved" (or correct it). After each step read the report's "Not verified" line.
4. `/audit` runs automatically in the plan after steps 5, 8 and 10; you can also run it any time. `/status` is read-only.
5. Steps are tagged `step-01` ... `backend-complete`. Commits are local only.

## 5. What I verified while building this pack (real runs, MySQL 8.0.46 in a scratch environment)
| Check | Result |
|---|---|
| `db/schema.sql` loads on an empty MySQL 8 database | OK, 6 tables |
| Reserve logic as pure SQL (stored procedure) racing 12 sessions for the same dates on a 2-room hotel, 15 rounds | exactly 2 winners in 15/15 rounds |
| 24-session mixed overlapping/back-to-back races, 15 rounds | invariants clean after every round |
| Confirm / cancel / expiry / late-confirm statements: affected-row counts and idempotency | 14/14 checks pass |
| `db/audit/invariants.sql`: deliberately corrupted data | all 10 invariants flagged their corruption (double booking flagged INV-05 + INV-01 on a corrected re-run) |
| Deadlocks | MySQL error 1213 occurred (about 4 of 960 requests in 40 contended rounds), so the retry-once rule is mandatory |

## 6. What I did NOT verify
- No Java/Spring code exists yet; none of the concurrency results are for the Spring implementation. They validate the SQL design only.
- I could not open Google's own Antigravity docs directly. The `.agents/` rules/skills/workflows conventions, the `AGENTS.md` support and the
  12,000-character limit per rule/workflow file come from several consistent third-party write-ups. The pack keeps every rule/workflow file far below that limit
  and has `/start` prove what the IDE actually loaded.
- Windows behaviour of the bash scripts; your installed Antigravity version.
- The reserve transaction ran in SQL, not through Spring's transaction proxy and a JDBC driver. Driver affected-row semantics and exception types are test items the agent must prove (docs/03).

## 7. Three corrections to our earlier discussion (found while validating; details in docs/01 section 10)
- A1: `booking.room_id` is NOT NULL, so the booking is inserted with the first candidate room and reassigned on retry (my earlier flow inserted it before choosing a room).
- A2: deadlocks do happen under contention, so the single retry is required, in a separate bean.
- A3: `expires_at` is cleared on confirm only; the earlier invariant draft was stricter than the design and was corrected.

## 8. Also decided by me (tagged DEFAULT, you can veto - see `docs/DECISIONS.md`)
Browse mode when no dates are given, max 30 nights, reference format, no Lombok/H2/Flyway, startup-only inventory top-up, `CONCURRENCY_CONFLICT` code after a second deadlock.
