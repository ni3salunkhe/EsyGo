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

## Step 00 - Step 0 gate (/start)        date: 2026-11-13
Commits: 
- 9b87d39 chore: add handover pack
- 0054c31 docs: record environment and decisions
- 14b1c4f docs: record commit hash in build log
Tag: none
Commands run and results:
- `& "C:\Program Files\Git\bin\bash.exe" scripts/check-frozen.sh` -> exit code 0, 6 files OK
- `& "C:\Program Files\Git\bin\bash.exe" scripts/check-pack.sh` -> exit code 0, PACK CHECK: PASS
- `java -version` -> openjdk version "17.0.13" 2024-10-15
- `javac -version` -> javac 17.0.13
- `mvn -v` -> Apache Maven 3.9.9
- `mysql --version` -> MySQL Community Server 8.0.46
- `git --version` -> git version 2.42.0.windows.2
- `git status` -> clean on main
Invariants: NOT RUN (no application tables populated; step 0 gate only)
Conformance: Handover pack and frozen hashes verified PASS
Deviations from the plan: none
Open items / blockers: none (Q-01 through Q-08 answered and closed in docs/DECISIONS.md)

## Step 01 - Scaffold        date: 2026-11-13
Commits: 
- 03b793c build(scaffold): configure Spring Boot project and layered architecture
- 7953aec docs: log step 01
- 9ad3764 docs: record commit hash for step 01 in build log
Tag: step-01
Commands run and results:
- `cd backend; mvn clean test` -> exit code 0, 6 tests, 0 failures
- `& "C:\Program Files\Git\bin\bash.exe" scripts/check-frozen.sh` -> exit code 0, 6 files OK
- `& "C:\Program Files\Git\bin\bash.exe" scripts/check-pack.sh` -> exit code 0, PACK CHECK: PASS
- `git check-ignore .env backend/target/` -> exit code 0, both ignored
Invariants: NOT RUN (no tables populated; Step 1 scaffold only)
Conformance: PASS (spec-conformance: MATCH 4 / NOT BUILT YET 16 / DEVIATION 0)
Deviations from the plan: none
Open items / blockers: none

## Step 02 - Database        date: 2026-11-13
Commits: 
- b71ee21 db(seed): implement seed data, inventory initializer and test bootstrap
- f74ba4a docs: log step 02
- 4d2d6ae docs: record commit hash for step 02 in build log
Tag: step-02
Commands run and results:
- `cd backend; mvn clean test` -> exit code 0, 12 tests, 0 failures (DB-01..04 pass)
- `scripts/verify-invariants.sh` (hotel_booking_test) -> exit code 0, row counts (5, 25, 9125, 0), violations=0
- `scripts/verify-invariants.sh` (hotel_booking) -> exit code 0, row counts (5, 25, 0, 0), violations=0
- `& "C:\Program Files\Git\bin\bash.exe" scripts/check-frozen.sh` -> exit code 0, 6 files OK
- `& "C:\Program Files\Git\bin\bash.exe" scripts/check-pack.sh` -> exit code 0, PACK CHECK: PASS
Invariants: PASS (all 10 invariants report 0 violations on seeded database)
Conformance: PASS (spec-conformance: MATCH 7 / NOT BUILT YET 13 / DEVIATION 0)
Deviations from the plan: none
Open items / blockers: none

## Step 03 - Domain and repositories        date: 2026-11-13
Commits: 
- 59d5714 feat(domain): map JPA entities and implement guarded repositories
- 84e7548 docs: log step 03
- e1b8b09 docs: record commit hash for step 03 in build log
Tag: step-03
Commands run and results:
- `cd backend; mvn clean test` -> exit code 0, 27 tests, 0 failures (SCHEMA-VAL, T-REPO-01..12 pass)
- `scripts/verify-invariants.sh` (hotel_booking_test) -> exit code 0, row counts (5, 25, 9125, 0), violations=0
- `& "C:\Program Files\Git\bin\bash.exe" scripts/check-frozen.sh` -> exit code 0, 6 files OK
- `& "C:\Program Files\Git\bin\bash.exe" scripts/check-pack.sh` -> exit code 0, PACK CHECK: PASS
Invariants: PASS (all 10 invariants report 0 violations on seeded database with inventory)
Conformance: PASS (spec-conformance: MATCH 10 / NOT BUILT YET 10 / DEVIATION 0)
Deviations from the plan: none
Open items / blockers: none

## Step 04 - Pricing, validation, reference generator        date: 2026-11-13
Commits: 
- d6390f4 feat(service): implement pricing, validation, reference generator, and deadlock retry
- f0e0ed8 docs: log step 04
Tag: step-04
Commands run and results:
- `cd backend; mvn clean test` -> exit code 0, 49 tests, 0 failures (PRC-*, VAL-*, REF-*, RETRY-* pass)
- `scripts/verify-invariants.sh` (hotel_booking_test) -> exit code 0, row counts (5, 25, 9125, 0), violations=0
- `& "C:\Program Files\Git\bin\bash.exe" scripts/check-frozen.sh` -> exit code 0, 6 files OK
- `& "C:\Program Files\Git\bin\bash.exe" scripts/check-pack.sh` -> exit code 0, PACK CHECK: PASS
Invariants: PASS (all 10 invariants report 0 violations on seeded database with inventory)
Conformance: PASS (spec-conformance: MATCH 14 / NOT BUILT YET 6 / DEVIATION 0)
Deviations from the plan: none
Open items / blockers: none

## Step 05 - Browse, search, hotel detail        date: 2026-11-13
Commits: 
- fe81f01 feat(api): implement browse, search, and hotel detail endpoints
Tag: step-05
Commands run and results:
- `mvn test -f backend/pom.xml` -> exit code 0, 59 tests, 0 failures (SRC-01..08, API contract pass)
- `scripts/verify-invariants.sh` (hotel_booking_test) -> exit code 0, row counts (5, 25, 9125, 0), violations=0
- `scripts/verify-invariants.sh` (hotel_booking) -> exit code 0, row counts (5, 25, 0, 0), violations=0
- `& "C:\Program Files\Git\bin\bash.exe" scripts/check-frozen.sh` -> exit code 0, 6 files OK
Invariants: PASS (all 10 invariants report 0 violations)
Conformance: PASS (spec-conformance: MATCH 17 / NOT BUILT YET 3 / DEVIATION 0)
Deviations from the plan: none
Open items / blockers: none
