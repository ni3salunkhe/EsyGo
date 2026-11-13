# Build log (agent appends one entry per step and per audit; real data only)

Entry template:
```
## Step NN - <title>        date: YYYY-MM-DD
Commits: <short hash> <subject> ... (copy from `git log --oneline`)
Tag: step-NN
Commands run and results: `<exact command>` -> exit code, N tests, N failures (paste the real summary line)
Invariants: scripts/verify-invariants.sh -> PASS/FAIL (paste real output)
Conformance: result of the spec-conformance skill (PASS / findings)
Deviations from the plan: none | <list, each with owner approval reference>
Open items / blockers: none | <ids from docs/OPEN_QUESTIONS.md>
```

(no entries yet)
