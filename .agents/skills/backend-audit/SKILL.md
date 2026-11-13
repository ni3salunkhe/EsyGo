---
name: backend-audit
description: "Runs an evidence-based audit of the hotel booking backend against docs/06-audit-checklist.md and writes an audit report in audits/. Use when the owner asks for an audit, review, verification, quality check or sign-off, after build steps 5, 8 and 10, or before tagging backend-complete. Do not use to implement features or to fix findings (fix them in separate commits afterwards)."
---

# Backend audit

An audit is a set of experiments, not an opinion. Every checklist item ends PASS (with evidence), FAIL (finding) or NOT RUN (with the reason).
Self-certification without evidence is a violation of rule 10.

## Procedure
1. Create `audits/AUDIT-<YYYYMMDD>-<N>.md` from `audits/TEMPLATE.md`. Record real environment output (`java -version`, build tool version, `mysql --version`, `git rev-parse --short HEAD`).
2. Work through docs/06-audit-checklist.md sections A to I in order. For each item run the actual command or inspection and paste the key output or file:line.
3. Spec conformance (A): use the spec-conformance skill. Data integrity (B): run `scripts/verify-invariants.sh`, then do the negative proof by corrupting a COPY of the test data on purpose
   and showing the matching INV fails (see `references/audit-method.md`).
4. Concurrency (C): run CONC-* ten times (skill booking-concurrency-testing) and record pass counts.
5. Test quality (G): perform mutation spot-checks M1-M5 exactly as written. For each: apply the temporary break, run the named tests, show them FAIL, revert with `git checkout -- <file>`,
   show `git status` clean and the tests green. A mutation that does NOT make a test fail is a HIGH finding (vacuous test).
6. Reproducibility (H): run the README setup literally on an EMPTY database (drop and recreate the test DB) and report any step that did not work as written.
7. Git hygiene (I): `git log --oneline`, scan history for secrets (`git log -p` greps for password/secret/token), confirm no remote push occurred and tags exist.
8. Fill the findings table (severity, evidence, proposed fix). Do not fix anything inside the audit. Commit the report: `docs(audit): add AUDIT-<id> for <scope>`.
9. Append a short entry to docs/BUILD_LOG.md and report to the owner using the reporting format in rule 40.

## Rules
Never skip an item silently. Never write PASS without evidence. Never edit a finished audit - write a new one. Verdict is PASS only when every item is PASS.
