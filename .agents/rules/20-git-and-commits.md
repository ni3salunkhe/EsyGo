# Rule: git workflow and clean commits (applies from the very first step)

## Setup (Step 0)
- Run `git status`. If the folder is not a repository: `git init -b main`. If `git config user.name`/`user.email` are unset, ASK the owner
  (Q-05). Never invent an identity and never change global git config.
- First commits: `.gitignore` check, then the pack as delivered. Never commit before checking `git status` and `git diff --staged`.

## Cadence
- Commit after EVERY green logical unit (one concern, builds, relevant tests pass). Never leave more than roughly one hour of work or ~400 changed
  lines uncommitted. A step is never finished with a dirty tree.
- At the end of each build step: commit the BUILD_LOG/TRACEABILITY updates, then tag `step-NN` (final: `backend-complete`).

## Commit format (Conventional Commits)
`type(scope): imperative summary, max 72 chars, no trailing period`
- Types: feat, fix, test, refactor, docs, build, chore, db. Scopes: search, booking, expiry, inventory, schema, api, errors, config, audit.
- Body (wrap ~72): WHY the change was needed, key decisions, and verification run, e.g. `Verified: mvn test -> 41 tests, 0 failures`.
  Only state verification you actually ran. Footer: `Refs: step-NN` (and `CR-NNN` if relevant).
- One logical change per commit. Code and the tests that prove it may share a commit, or tests may come first. Do not mix refactors with features,
  formatting sweeps with logic, or unrelated files.
- Every commit must compile and pass the test suite that exists at that point (docs-only commits excepted). Never commit a red build "to save work".

## Staging
- Use explicit paths (`git add path/...`) or `git add -A` only after reading `git status`. Always review `git diff --staged`.
- Never commit: `.env`, credentials, tokens, DB dumps containing data, `target/`, `build/`, `.idea/`, `*.log`, OS files, local scratch notes.
- If a secret was staged: unstage it. If it was committed: STOP and tell the owner immediately; do not try to hide it with history rewriting.

## Forbidden without explicit owner approval
`git push` or any remote operation, `--force`, `reset --hard`, `clean -fd`, `rebase`, `commit --amend` of an earlier commit, deleting branches/tags,
history rewriting of any kind. Mistakes are fixed forward with a new commit.

## Verification of hygiene
`git log --oneline` must read like a changelog: each line meaningful, no "wip", "fix", "update", "misc", "final", "asdf".
