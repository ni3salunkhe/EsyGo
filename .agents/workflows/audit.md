---
description: Run the evidence-based backend audit and write audits/AUDIT-<date>-<n>.md. Use after steps 5, 8, 10 or on request.
---

# /audit

1. Use the backend-audit skill. Scope = current HEAD (record `git rev-parse --short HEAD`).
2. Work through docs/06-audit-checklist.md A-I. Every item PASS (with evidence), FAIL or NOT RUN (with the reason). No other state.
3. Include negative proofs, ten consecutive suite runs, and the mutation spot-checks M1-M5 (revert each mutation; show a clean `git status`).
4. Write the report from audits/TEMPLATE.md, commit it (`docs(audit): ...`), append to docs/BUILD_LOG.md.
5. Do NOT fix findings in this workflow. Summarise findings by severity and ask the owner which to fix first. Fixes are separate commits followed by a re-check of the affected items.
