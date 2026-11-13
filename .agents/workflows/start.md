---
description: Step 0 gate - load the pack, verify the environment, get open questions answered, initialise git. Run once at the very start.
---

# /start - Step 0 gate (no application code in this step)

1. Read, in order: AGENTS.md, .agents/rules/*, docs/00-assignment-verbatim.md, docs/01-final-design.md, db/schema.sql, docs/02-api-contract.md,
   docs/03-flows.md, docs/DECISIONS.md, docs/04-build-plan.md, docs/05-test-plan.md, docs/06-audit-checklist.md, docs/OPEN_QUESTIONS.md.
2. Prove the pack is loaded: list the workspace rules, skills and workflows you can actually see, with their file paths. If any is missing from what the IDE
   loaded, say so (do not pretend). If `.agents/` is not recognised by this Antigravity version, tell the owner; the folders may need renaming to `.agent/`.
3. Write a short understanding summary (max 25 lines): scope, the six entities, the state machines, the reserve flow including amendment A1, and the
   non-negotiables - in your own words. Flag anything you find inconsistent or unclear in the pack with file references. Do not fix pack files.
4. Run `bash scripts/check-frozen.sh` and `bash scripts/check-pack.sh` and show the real output (both must PASS before you continue).
   Then record REAL environment facts by running: `java -version`, `javac -version`, `mvn -v` and `gradle -v` (whichever exist), `mysql --version`, `git --version`, `git status`.
   Show the output. Do not assume what is installed.
5. Ask the owner the open questions in docs/OPEN_QUESTIONS.md (one numbered message, using the raise-blocker conventions). Wait for answers.
6. Record answers in docs/DECISIONS.md (new rows) and close the questions. For Spring Boot/dependency versions: look them up from official sources, show the source, ask for approval.
7. Git: initialise if needed, ask for identity if unset (Q-05), verify `.gitignore`, then commit the pack as delivered (`chore: add handover pack`) and the answers (`docs: record environment and decisions`).
8. Report using the format in rule 40. STOP. The next action is the owner's approval to run `/build-step` for Step 1.
