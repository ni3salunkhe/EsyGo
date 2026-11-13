---
name: raise-blocker
description: "Stops work and asks the owner a precise question instead of assuming. Use whenever the design is silent, ambiguous or contradictory, a decision is not listed in docs/DECISIONS.md, the environment is unknown or unavailable (MySQL, JDK, build tool, git identity), a test cannot be made to pass honestly, or a frozen file seems wrong. Do not use for questions already answered in the docs - read them first."
---

# Raise a blocker (do not assume)

1. Stop work on the affected part. Continue only with tasks that do not depend on the answer.
2. Check docs/00-03 and docs/DECISIONS.md once more; if the answer is there, use it and cite it.
3. Append a row to docs/OPEN_QUESTIONS.md (next Q-id): the question, why it matters, the concrete options with consequences, and your PROPOSED option clearly marked as a proposal.
   If a frozen file seems wrong, write docs/change-requests/CR-NNN.md instead (what, why, evidence, impact, options) per rule 00.
4. Ask the owner in chat in ONE short message: numbered questions, each with its options. Do not bundle unrelated topics, do not hide the question inside a long report.
5. Wait. Silence is not approval. When answered, record the answer in docs/DECISIONS.md (new row: ID, decision, "owner approved in chat", date) and mark the question CLOSED.
6. Never convert your proposal into a decision on your own, and never describe a guess as a fact.

## Environment blockers
If a required tool or database is unavailable, say exactly which command failed and its real error output. Do not simulate, mock or skip. Ask how to proceed.

## Test blockers
If a test fails and you believe the test is wrong, show the evidence (design reference + real output) and ask. Never change the test first.
