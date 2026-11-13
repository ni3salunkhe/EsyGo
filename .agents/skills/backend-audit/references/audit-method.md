# Audit method notes

## Secret scan (D1, SEC-01/02) - run and paste output
- Working tree: `git grep -nIiE "password\s*[:=]|secret|token|jdbc:mysql://[^ ]*:[^ ]*@" -- . ':!docs' ':!*.md'` -> every hit explained or removed.
- History: `git log -p --all | grep -inE "password\s*[:=]|secret|api[_-]?key"` -> every hit explained.
- `git check-ignore -v .env` shows it is ignored; `git ls-files | grep -i "\.env$"` returns nothing.

## Negative proof for invariants (B2)
Work on the TEST database only. Example: insert an overlapping active booking for an already booked room (without nights) and show INV-05 and INV-01 report > 0, then restore clean data.
Another: set one RESERVED night to AVAILABLE while its booking stays HELD -> INV-01/INV-02 flag it. The point is to prove the checks are able to fail.

## No vacuous passes
Before trusting any green result confirm the precondition: rows exist (hotels, rooms, room_nights, bookings as the test expects). Report row counts next to every invariant run.

## Flakiness (G4)
Run the entire suite 10 times in a row; report `passes/10`, and the names of any test that ever failed. Do not rerun "until green".

## Money/time greps (B3)
`git grep -nE "\b(float|double|Float|Double)\b" -- 'backend/src/main'` must have no hit related to money.
`git grep -n "LocalDate.now()\|Instant.now()\|System.currentTimeMillis" -- 'backend/src/main'` -> each hit must use the injected Clock or be justified.
