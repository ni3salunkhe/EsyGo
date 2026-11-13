# Open questions - must be answered by the owner at the Step 0 gate

The agent asks these (one message, numbered), records the answers in docs/DECISIONS.md, and does NOT guess. "Proposed" is only a
suggestion to make answering easy; it has no effect until the owner approves it.

| ID | Question | Proposed (not applied) | Answer | Status |
|---|---|---|---|---|
| Q-01 | Operating system and shell (the helper scripts are bash)? | Windows: use WSL or Git Bash | | OPEN |
| Q-02 | How is MySQL 8 available (local install or Docker) and how are DB credentials supplied (env vars)? Is a separate empty `*_test` database allowed? | local MySQL 8, DB `hotel_booking` + `hotel_booking_test` | | OPEN |
| Q-03 | Build tool: Maven or Gradle? | Maven | | OPEN |
| Q-04 | Java version to target (installed JDK vs Spring Boot's current requirement - the agent must verify both from real commands/official docs)? | newest installed LTS that current Spring Boot supports | | OPEN |
| Q-05 | Git: is the folder already a repo? Name/email to use for commits (the agent must not invent an identity)? | | | OPEN |
| Q-06 | Time zone for "today" in date validation (check-in cannot be in the past)? | Asia/Kolkata, configurable | | OPEN |
| Q-07 | Base Java package name? | | | OPEN |
| Q-08 | Folder layout: backend code in `backend/` (leaves room for `frontend/`)? | yes | | OPEN |
