# Frontend Audit Report — Milestone 4: Guest Details & Reservation Hold Flow

- **Date:** 2026-11-13
- **Branch:** `main`
- **HEAD before:** `96f0043`
- **Milestone Scope:** M4 — Guest form, server validation feedback, create HELD request, hold response and timer
- **Verification Standard:** Source-code and command verified. Zero assumptions.

---

## 1. Scope and Changed Files

- `frontend/src/components/booking/GuestForm.jsx` — Guest details collection form:
  - Collects `guestName` (1–100 chars, trimmed, required) and `guestEmail` (valid format, <= 150 chars, trimmed, required)
  - Displays selected hotel and stay summary (dates, nights, rate, and server total)
  - Dispatches `POST /api/bookings` with `{ hotelId, checkIn, checkOut, guestName, guestEmail }`
  - **Price Authority Verification (Gate):** Strictly omits price/total in the request payload; backend remains the sole price and room assignment authority
  - Disables double-submission during in-flight network requests
  - Maps backend `fieldErrors` inline and handles 409 `SOLD_OUT` / `CONCURRENCY_CONFLICT` errors gracefully
- `frontend/src/components/booking/CountdownTimer.jsx` — Visual countdown timer:
  - Computes remaining minutes and seconds based on backend-supplied `expiresAt`
  - Visual alert states: normal (brand blue), expiring soon (< 3 min, pulsing amber), expired (< 0 sec, rose alert)
  - `role="timer"` with `aria-live="polite"`
- `frontend/src/components/booking/HoldReviewModal.jsx` — Held reservation status view:
  - Displays returned booking reference (e.g. `HB-XXXXXX`), status `HELD`, assigned `roomNumber`, guest details, and server total
  - Integrates `CountdownTimer`
  - Disables next-step payment action when hold has expired
- `frontend/src/App.jsx` — Connected state machine for `guest-form` and `hold-review` stages.
- `frontend/tests/hold.test.jsx` — 10 unit and component tests verifying timer decrements/expiry, client validation, payload adherence (no price authority sent), backend error feedback, and hold review rendering.

---

## 2. Backend Read-Only Verification

- `git diff --name-only 96f0043 HEAD -- backend/ db/ scripts/`: **Empty** (0 modifications to backend code, database, or scripts).
- Protected paths changed: **NO**
- Existing untracked files preserved: **YES**
- Evidence and conclusion: Strict backend read-only gate maintained.

---

## 3. API Contract Review

- **Endpoint:** `POST /api/bookings`
- **Payload Shape:**
  ```json
  {
    "hotelId": 1,
    "checkIn": "YYYY-MM-DD",
    "checkOut": "YYYY-MM-DD",
    "guestName": "Guest Name",
    "guestEmail": "guest@example.com"
  }
  ```
  Verified that no price or total amount is sent by the frontend.
- **Success Response:** `201 Created` with Location header `/api/bookings/{reference}`, returning JSON with `reference`, `status: "HELD"`, `roomNumber`, `expiresAt`, `totalAmount`, etc.
- **Hold Authority:** Server clock (`NOW()`) and background expiry job are authoritative. Visual countdown provides user feedback only.

---

## 4. Build and Test Evidence

| Check | Command | Exit Code | Result | Raw Output Summary |
|---|---|---:|---|---|
| **Unit & Component Tests** | `npm test` | 0 | PASS | 5 test files, 55 passed, 0 failed, duration 3.95s |
| **Production Build** | `npm run build` | 0 | PASS | `dist/index.html` (0.77 kB), `dist/assets/*.css` (29.52 kB), `dist/assets/*.js` (212.55 kB) built in 3.79s |

---

## 5. User-Journey Results

| Journey | Result | Evidence |
|---|---|---|
| **Proceed to booking from detail** | PASS | Transitions to guest form with hotel & stay dates prefilled |
| **Validate guest details** | PASS | Rejects empty name/email or invalid email before dispatching |
| **Create reservation hold** | PASS | Dispatches valid payload; handles 201 Created response |
| **Server error handling** | PASS | Displays backend error alerts for `SOLD_OUT` / `CONCURRENCY_CONFLICT` |
| **10-minute hold timer** | PASS | Counts down to `expiresAt`; shows expired warning when time elapses |
| **Expired hold gating** | PASS | Disables payment progression when hold has expired |

---

## 6. Responsive and Visual Review

| Viewport | Guest Form | Hold Review Card | Countdown Timer | Result |
|---|---|---|---|---|
| **320px / 375px (Mobile)** | Full-width inputs, stacked buttons | Full-width card with wrapped summary | Prominent banner | PASS |
| **768px (Tablet)** | 2-col stay summary, 44px+ tap targets | Centered card with clean spacing | Compact timer | PASS |
| **1024px / 1440px (Desktop)** | Max-w-2xl centered card with glass shadow | Max-w-2xl centered card | Header-aligned timer | PASS |

---

## 7. Accessibility and Loading / Error States

- **Loading State:** Spinner and disabled button during in-flight `POST /api/bookings`.
- **Timer Accessibility:** `role="timer"` with `aria-live="polite"` and informative label.
- **Form ARIA:** `aria-invalid` and `aria-describedby` linking input fields to their error messages.
- **Motion:** Responsive to `prefers-reduced-motion`.

---

## 8. Findings

None. Zero blockers.

---

## 9. Not Run / Blocked

- Real write mutations against the live MySQL database during automated test execution: **NOT RUN**. Tests mock API calls to avoid mutating development database records. Real database mutation tests require an isolated database whose name ends with `_test`.

---

## 10. Verdict

**PASS**. Build passes, 55 tests pass, payload and 201 response verified, price authority strictly preserved on backend, zero backend modifications.
