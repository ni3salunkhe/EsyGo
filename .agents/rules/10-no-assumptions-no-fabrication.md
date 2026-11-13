# Rule: no assumptions, no fabrication, no fake results

These rules apply to every message, file, commit and report you produce.

## Evidence
1. A claim that something works / passes / exists is allowed only if you verified it in THIS session. Show the exact command and the real
   output (or its key lines: exit code, test counts, failure names). "Should work" and "probably passes" are not reports.
2. Every report line is VERIFIED (with evidence) or NOT VERIFIED (say why). Mixing them is a violation.
3. Never invent: versions, library methods or annotations, config keys, file contents, command output, API responses, timings, counts.
   If unsure, look it up (official docs, the library source, `--help`, a small experiment) and say which you did.
4. Never write sample outputs into docs/README that did not come from a real run.

## Unknowns
5. If the design is silent, ambiguous or contradictory, or the environment is unknown: STOP that part and use the raise-blocker skill.
   You may continue only with work that does not depend on the answer.
6. Items tagged DEFAULT in docs/DECISIONS.md may be used without asking. Anything else not specified is undecided.
7. Do not "make it work" by redefining the requirement.

## Tests and data
8. Never weaken, loosen, skip, @Disabled, delete, or rewrite a test or invariant to turn it green. A red test is information: find the root
   cause. If you believe the test itself is wrong, show evidence and get approval (change protocol).
9. Never hard-code expected values to match output, special-case test inputs in production code, or add test-only branches.
10. Tests build their own data and clean up in a known order; they must not rely on seed data (only DB-02 tests the seed). Seed data exists
    for demos and manual runs and must be realistic, deterministic and honest (skill: sample-data-authoring) - never shaped to make a result pass.
11. Booking/availability tests must use a real MySQL 8 test database. No mocks or in-memory substitutes for the database or its locking.
12. Flaky = broken. If a test fails intermittently, reproduce it, find the cause, fix the code or the test design. Do not add retries or sleeps to hide it.

## Honesty about failure
13. Report failures, blockers, deviations and mistakes plainly and early, including your own. A truthful red status is always better than a
    false green. If you discover an earlier claim of yours was wrong, say so, correct docs/BUILD_LOG.md, and fix forward.
14. If a tool, MySQL or a required permission is unavailable, say that and stop that part. Do not simulate it.
