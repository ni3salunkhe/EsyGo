# Frontend Audit Report — Milestone 2: Discovery and Search

- **Date:** 2026-11-13
- **Branch:** `main`
- **HEAD before:** `d663f57`
- **Milestone Scope:** M2 — Live browse, generic name/location search, real amenity/price filters, date controls, loading/empty/error skeleton states
- **Verification Standard:** Source-code and command verified. Zero assumptions.

---

## 1. Scope and Changed Files

- `frontend/src/utils/dateUtils.js` — Date validation & calculations strictly aligned to Asia/Kolkata timezone: `[checkIn, checkOut)` half-open interval, max 30 nights, max 365 advance days, past-date prohibition.
- `frontend/src/components/search/SearchCapsule.jsx` — Elevated unified search capsule: generic destination/hotel query, check-in, check-out, inline validation guard, and reset to browse.
- `frontend/src/components/search/FilterDrawer.jsx` — Dynamic amenities extracted from live API catalog, price slider/range, sort options (Recommended, Price Asc/Desc, Name), and future filter area. Desktop sticky sidebar & mobile slide-in drawer.
- `frontend/src/components/hotel/HotelCard.jsx` — Photo-forward card with `HotelMedia` non-photographic fallback, real amenities, price per night, and search-mode availability/total. In browse mode, availability and total amounts are omitted.
- `frontend/src/components/hotel/HotelList.jsx` — Responsive grid of cards, skeleton loading state, and distinct empty states for zero backend results vs filtered-out results.
- `frontend/src/pages/LandingPage.jsx` — Complete discovery page integrating search, filtering pipeline, API browse/search invocation, and error recovery.
- `frontend/src/App.jsx` — Connected view state for `LandingPage` with transition to hotel detail and manage booking.
- `frontend/tests/search.test.jsx` — 13 unit & component tests covering search capsule validation, filter drawer toggles, hotel cards, list states, and landing page filter pipeline.

---

## 2. Backend Read-Only Verification

- `git diff --name-only d663f57 HEAD -- backend/ db/ scripts/`: **Empty** (0 modifications to backend code, database, or scripts).
- Protected paths changed: **NO**
- Existing untracked files preserved: **YES**
- Evidence and conclusion: Strict backend read-only gate maintained.

---

## 3. API Contract Review

- **Browse Mode (No Dates):** Dispatches `GET /api/hotels`. The API returns basic property attributes without availability or total calculations. Frontend strictly omits `availableRooms` and `totalAmount` in browse mode.
- **Search Mode (Both Dates):** Dispatches `GET /api/hotels?checkIn=...&checkOut=...`. Renders backend-supplied `availableRooms`, `nights`, and `totalAmount`.
- **Single Date Guard:** If a user selects only one date, `validateDates` intercepts the submission inline and prevents any invalid API call.
- **Generic Search Semantics:** Per requirement, the generic search field performs client-side substring matching over live returned hotel `name` and `location`. It does not send hotel names to the backend `location` query parameter (which is exact-match only).

---

## 4. Build and Test Evidence

| Check | Command | Exit Code | Result | Raw Output Summary |
|---|---|---:|---|---|
| **Unit & Component Tests** | `npm test` | 0 | PASS | 3 test files, 36 passed, 0 failed, duration 4.15s |
| **Production Build** | `npm run build` | 0 | PASS | `dist/index.html` (0.77 kB), `dist/assets/*.css` (26.00 kB), `dist/assets/*.js` (182.98 kB) built in 11.40s |

---

## 5. User-Journey Results

| Journey | Result | Evidence |
|---|---|---|
| **Browse live catalog on landing** | PASS | Mount triggers `getHotels()` and displays card grid |
| **Generic destination / hotel name search** | PASS | Substring match on real `name` and `location` filters card list |
| **Date-based availability search** | PASS | Valid dates query API with ISO format; displays room count and server total |
| **Single-date entry guard** | PASS | Displays "Please select a check-out date" alert and prevents submission |
| **Dynamic amenity filtering** | PASS | Amenities dynamically populated from returned hotels; filters narrow list |
| **Price filtering & sorting** | PASS | Slider limits max price; sort orders by price ascending/descending or name |
| **Empty state handling** | PASS | Distinguishes between zero catalog availability and zero filter matches |

---

## 6. Responsive and Visual Review

| Viewport | Landing | Detail | Search / Filter | Result |
|---|---|---|---|---|
| **320px / 375px (Mobile)** | Clean hero text wrap, stacked search inputs | Scaffold ready | Collapsible drawer with toggle button | PASS |
| **768px (Tablet)** | 2-column card grid, accessible touch targets | Scaffold ready | Compact search capsule | PASS |
| **1024px / 1440px (Desktop)** | 2 to 3-column card grid, generous negative space | Scaffold ready | Sticky left filter rail, horizontal search capsule | PASS |

---

## 7. Accessibility and Loading / Error States

- **Skeletons:** Animated pulse with `aria-hidden="true"` during fetch.
- **Keyboard Navigation:** Filter buttons, search form inputs, and hotel cards support keyboard focus and Enter key selection.
- **Contrast & Motion:** High-contrast text on white/neutral surfaces; `prefers-reduced-motion` suppresses transforms.
- **Screen Reader Support:** Semantic `<article>`, `<header>`, `<aside>`, `<form role="search">`, and clear button labels.

---

## 8. Findings

None. Zero blockers.

---

## 9. Not Run / Blocked

- Real booking mutation E2E against backend database: **NOT RUN**. Milestone 2 is read-only hotel discovery and client-side filtering; booking mutation tests are scoped to M4–M6.

---

## 10. Verdict

**PASS**. Build passes, 36 tests pass, search/filter pipeline verified against API contracts, zero backend modifications.
