---
description: Report the real current state - git, build log, open questions, test results - without changing anything.
---

# /status (read-only)

Run and show: `git status`, `git log --oneline -15`, `git tag`. Read docs/BUILD_LOG.md, docs/TRACEABILITY.md and docs/OPEN_QUESTIONS.md.
If a backend exists, run the test suite and `scripts/verify-invariants.sh` and show real results.
Report: current step, last completed step, requirements VERIFIED / IN PROGRESS / NOT STARTED (counts from TRACEABILITY), open questions, blockers, and anything NOT VERIFIED.
Do not edit files, do not commit, do not start work.
