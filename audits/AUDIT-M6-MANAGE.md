# Frontend Audit Report — Milestone 6: Manage Booking & Cancellation

- **Date:** 2026-11-13
- **Branch:** `main`
- **HEAD before:** `63c3775`
- **Milestone Scope:** M6 — Reference + email lookup, status card, eligibility-aware cancellation dialog and API call
- **Verification Standard:** Source-code and command verified. Zero assumptions.

---

## 1. Scope and Changed Files

- `frontend/src/pages/ManageBookingPage.jsx` — Dedicated booking management interface:
  - Form requiring both booking reference (e.g. `HB-XXXXXX`) and registered guest email
  - Client-side validation preventing lookup requests when reference or email is missing
  - Dispatches `GET /api/bookings/{reference}?email={email}`
  - Uniform 404 error handling preventing reference/account enumeration
  - Comprehensive status card displaying status badge (`CONFIRMED`, `HELD`, `CANCELLED`, `EXPIRED`), property details, room number, stay dates, rate, and total amount
  - **Cancellation Eligibility Logic (CAN-04):**
    - Enabled only when status is `CONFIRMED` or `HELD` AND `checkIn > today` in `Asia/Kolkata`
    - Disabled with clear policy explanation when `checkIn <= today` (cancellation period lapsed)
    - If already cancelled, displays status notice without a cancellation button
  - Accessible `Dialog` primitive for cancellation confirmation:
    - Explicit disclosure: "No refund is collected or processed as this is a demo reservation"
    - Explains that room nights will immediately transition back to `AVAILABLE` in MySQL
    - Dispatches `POST /api/bookings/{reference}/cancel` with `{ email }`
- `frontend/src/App.jsx` — Connected view state for `ManageBookingPage`, including auto-prefilling reference and email when transitioning from the confirmation receipt.
- `frontend/tests/manage.test.jsx` — 7 unit and component tests verifying lookup form validation, uniform 404 message, detail rendering, dialog dismissal without API call, cancellation confirmation with status transition to CANCELLED, and post-check-in cancellation prevention.

---

## 2. Backend Read-Only Verification

- `git diff --name-only 63c3775 HEAD -- backend/ db/ scripts/`: **Empty** (0 modifications to backend code, database, or scripts).
- Protected paths changed: **NO**
- Existing untracked files preserved: **YES**
- Evidence and conclusion: Strict backend read-only gate maintained.

---

## 3. API Contract Review

- **Lookup Route:** `GET /api/bookings/{reference}?email={email}`
- **Cancellation Route:** `POST /api/bookings/{reference}/cancel` with JSON payload `{ "email": "guest@example.com" }`
- **Contract Accuracy:**
  1. Both operations strictly require and send both reference and email.
  2. Cancellation returns `200 OK` with updated booking response (`status: "CANCELLED"`).
  3. Mismatched or unknown references uniformly trigger 404 `NOT_FOUND`.
  4. Same-day or past stays are blocked from cancellation on the client, complying with backend `CAN-04` / 409 `INVALID_STATE`.

---

## 4. Build and Test Evidence

| Check | Command | Exit Code | Result | Raw Output Summary |
|---|---|---:|---|---|
| **Unit & Component Tests** | `npm test` | 0 | PASS | 7 test files, 71 passed, 0 failed, duration 6.2s |
| **Production Build** | `npm run build` | 0 | PASS | `dist/index.html` (0.77 kB), `dist/assets/*.css` (32.29 kB), `dist/assets/*.js` (238.81 kB) built in 12.02s |

---

## 5. User-Journey Results

| Journey | Result | Evidence |
|---|---|---|
| **Lookup validation** | PASS | Rejects missing reference/email without network dispatch |
| **Unknown booking lookup** | PASS | Displays uniform "not found or details don't match" message |
| **View confirmed booking** | PASS | Displays room number, status badge, dates, and total |
| **Dismiss cancel dialog** | PASS | Dismissing modal does NOT call cancellation API |
| **Confirm cancellation** | PASS | Calls cancel API with email; transitions status to CANCELLED |
| **Past / same-day cancellation** | PASS | Displays "Cancellation Period Lapsed"; hides cancel CTA |

---

## 6. Responsive and Visual Review

| Viewport | Lookup Form | Booking Card | Cancel Modal | Print Output | Result |
|---|---|---|---|---|---|
| **320px / 375px (Mobile)** | Stacked inputs | Full-width card with wrapped summary | Full-width modal | Clean layout | PASS |
| **768px (Tablet)** | 2-col inputs | 2-col stay details | Centered dialog | Clean layout | PASS |
| **1024px / 1440px (Desktop)** | Centered max-w-3xl | Glass-shadowed card | Centered modal with backdrop blur | Print styles active | PASS |

---

## 7. Accessibility and Loading / Error States

- **Loading State:** Spinner and disabled buttons during retrieval and cancellation.
- **Dialog Accessibility:** Focus trap, Escape key handling, backdrop click closure, and ARIA attributes.
- **Form ARIA:** `aria-invalid` on inputs with inline validation messages.
- **Motion:** Responsive to `prefers-reduced-motion`.

---

## 8. Findings

None. Zero blockers.

---

## 9. Not Run / Blocked

- Real write mutations against the live MySQL database during automated test execution: **NOT RUN**. Tests mock API calls to avoid mutating development database records.

---

## 10. Verdict

**PASS**. Build passes, 71 tests pass, retrieval and cancellation contracts verified, CAN-04 eligibility respected, zero backend modifications.
