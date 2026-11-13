# Audit report AUDIT-YYYYMMDD-N   (copy to audits/AUDIT-YYYYMMDD-N.md)

Scope: step/commit audited (`git rev-parse --short HEAD`): ____    Auditor: the agent    Date: ____
Environment (real output): `java -version` ____ | build tool ____ | `mysql --version` ____ | OS ____

## Summary
Counts: PASS __ / FAIL __ / NOT RUN __.   Verdict: PASS only if every checklist item is PASS, otherwise FAIL.
An audit that skipped items must say NOT RUN for each and why. "No findings" is only valid if every item was actually run.

## Checklist results (docs/06-audit-checklist.md)
| Item | Result | Evidence (exact command + real output excerpt, or file:line) |
|---|---|---|
| A1 | | |

## Findings
| ID | Severity (critical/high/medium/low) | Item | What is wrong | Evidence | Proposed fix | Status |
|---|---|---|---|---|---|---|

## Mutation spot-checks (G3)
| Mutation | Tests that failed (real output) | Reverted? (`git status` clean) |
|---|---|---|

## Statement of limits
List everything NOT verified and any claim that rests on inference rather than a run.
