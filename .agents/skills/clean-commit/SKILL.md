---
name: clean-commit
description: "Creates clean, timely, verified git commits using Conventional Commits, with staging review and secret checks. Use whenever a logical unit of work is finished and tests are green, before tagging a step, or when asked to commit, save progress or clean up history. Do not use for pushing, rebasing, amending older commits or any remote git operation - those are forbidden without explicit owner approval."
---

# Clean commit procedure

Follow .agents/rules/20-git-and-commits.md. Steps, in order, every time:
1. `git status` - read it. Identify exactly which files belong to THIS logical change. Leave unrelated changes unstaged (or finish/commit them separately).
2. Run the tests relevant to the change and, if code changed, the whole suite. A commit must build and pass. Do not commit a red tree.
3. Secret and junk check: `git diff --staged --name-only` must not list `.env`, build output, IDE files, logs, dumps. `git diff --staged` must contain no passwords/tokens.
4. Stage explicit paths: `git add <paths>`. Re-read `git diff --staged`.
5. Write the message (see `references/commit-examples.md`): type(scope): summary <= 72 chars; body = why + what was verified (only real runs); footer Refs.
6. `git commit`, then `git log --oneline -3` and `git status` (must be clean for that change).
7. At step end: commit BUILD_LOG/TRACEABILITY, then `git tag step-NN` (final `backend-complete`). Tags are never moved or deleted.

## Never
push; force; reset --hard; clean -fd; rebase; amend an earlier commit; commit with a failing test; commit generated files; write vague messages
("wip", "fix", "update"); claim verification that was not run. A bad commit is fixed forward with a new commit, or reported to the owner if it contains a secret.
