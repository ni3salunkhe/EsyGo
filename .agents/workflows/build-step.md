---
description: Execute the next build step from docs/04-build-plan.md - plan, get approval, implement, verify, commit, report.
---

# /build-step - run exactly one step of the build plan

1. Determine the step: the first step in docs/04-build-plan.md without a `step-NN` tag (check `git tag` and docs/BUILD_LOG.md). If the owner named a step, use that one.
2. Re-read the step's section, the design docs it touches, and the tests it requires in docs/05-test-plan.md.
3. Produce the Implementation Plan (artifact): files to create/change, tests to write (by ID), exact commands you will run, risks, anything you need decided.
   If anything is undecided -> raise-blocker. STOP and wait for the owner's explicit approval of the plan.
4. Implement in small logical units. After each green unit use the clean-commit skill. Tests first or together with the code. Never leave the tree red or dirty at the end.
5. Verify for real: run the step's tests, then the whole suite, then `scripts/verify-invariants.sh` (once a DB with data exists). Show the commands and real results.
6. Run the spec-conformance skill. Any DEVIATION means the step is not done.
7. Update docs/TRACEABILITY.md and append the docs/BUILD_LOG.md entry with real evidence; commit (`docs: log step NN`); tag `step-NN`.
8. Report in the rule-40 format (Done / Verified / Not verified / Deviations / Blocked). STOP. Do not begin the next step.
