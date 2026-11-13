# Frontend Audit Report — Milestone 3: Hotel Details & Availability

- **Date:** 2026-11-13
- **Branch:** `main`
- **HEAD before:** `0fdaa62`
- **Milestone Scope:** M3 — Route/detail fetch, image/fallback treatment, amenities/address/price, availability/sold-out/book CTA
- **Verification Standard:** Source-code and command verified. Zero assumptions.

---

## 1. Scope and Changed Files

- `frontend/src/pages/HotelDetailPage.jsx` — Dedicated hotel detail view implementing:
  - Integration with `GET /api/hotels/{hotelId}` (supporting optional check-in and check-out dates)
  - Lead photo display via `HotelMedia` (rendering non-photographic fallback for null `imageUrl`)
  - Full-screen photo lightbox dialog when real photo URL is present
  - Property name, location badge, full address, full description, and complete amenities grid
  - Interactive date adjustment form with inline validation
  - Real-time stay duration breakdown and server-calculated total price
  - Availability status banner: distinguishes `availableRooms > 0` vs `availableRooms === 0` (Sold Out)
  - Strict booking CTA state: enabled only when dates are selected and property is not sold out; disabled with clear feedback when sold out (`availableRooms === 0`) or dates are missing
  - Error state handling (e.g. 404 or network failure) with catalog recovery button
  - Accessible back navigation preserving selected dates
- `frontend/src/App.jsx` — Updated to route to `HotelDetailPage` upon hotel selection with scroll restoration.
- `frontend/tests/detail.test.jsx` — 9 unit and component tests verifying loading skeletons, detail attributes, non-photographic fallback, photo lightbox, browse-mode CTA disabling, date availability calculations, sold-out disabling (M3 Gate), error handling, and back navigation.

---

## 2. Backend Read-Only Verification

- `git diff --name-only 0fdaa62 HEAD -- backend/ db/ scripts/`: **Empty** (0 modifications to backend code, database, or scripts).
- Protected paths changed: **NO**
- Existing untracked files preserved: **YES**
- Evidence and conclusion: Strict backend read-only gate maintained.

---

## 3. API Contract Review

- **Hotel Detail Endpoint:** `GET /api/hotels/{hotelId}`.
- **Date Availability Query:** `GET /api/hotels/{hotelId}?checkIn=...&checkOut=...`.
- **Sold-Out Semantics:** When dates are queried and property inventory is exhausted, the backend detail endpoint returns `200 OK` with `availableRooms: 0`.
- **Verification:** Verified that `availableRooms === 0` renders a "Sold Out" status badge and completely disables the booking action.
- **Image Lifecycle:** Singular nullable `imageUrl` handled cleanly without fabricating photo carousels or external mock URLs.

---

## 4. Build and Test Evidence

| Check | Command | Exit Code | Result | Raw Output Summary |
|---|---|---:|---|---|
| **Unit & Component Tests** | `npm test` | 0 | PASS | 4 test files, 45 passed, 0 failed, duration 5.80s |
| **Production Build** | `npm run build` | 0 | PASS | `dist/index.html` (0.77 kB), `dist/assets/*.css` (28.27 kB), `dist/assets/*.js` (197.47 kB) built in 5.19s |

---

## 5. User-Journey Results

| Journey | Result | Evidence |
|---|---|---|
| **Select hotel card from landing** | PASS | Navigates to detail view, loads hotel via API, scrolls to top |
| **Browse mode without dates** | PASS | Displays hotel specifications and nightly rate; prompts user to select dates |
| **Select / adjust stay dates** | PASS | Triggers `getHotelDetail` with dates; computes nights and total amount |
| **Sold out hotel handling** | PASS | `availableRooms: 0` shows Sold Out badge and disables booking CTA |
| **Available room reservation** | PASS | `availableRooms > 0` activates "Reserve Room • Start 10-Min Hold" CTA |
| **Lead photo fallback** | PASS | Renders elegant non-photographic placeholder with building icon & "Photos coming soon" |
| **Real photo lightbox** | PASS | Displays "View Full Photo" button and opens accessible photo dialog |
| **Back navigation** | PASS | Returns to Landing page with search criteria and date selections intact |

---

## 6. Responsive and Visual Review

| Viewport | Header / Lead Image | Detail Content | Booking Card | Lightbox | Result |
|---|---|---|---|---|---|
| **320px / 375px (Mobile)** | 16:9 lead image, wrapped title | Stacked amenities grid | Bottom-stacked card with full-width CTA | Full-width modal | PASS |
| **768px (Tablet)** | 16:9 lead image, compact title | 2-col amenities grid | Full-width date form & rate summary | Centered dialog | PASS |
| **1024px / 1440px (Desktop)** | 21:9 panoramic lead image | 3-col amenities grid | Sticky right rail (top-24) | Max-w-4xl centered modal | PASS |

---

## 7. Accessibility and Loading / Error States

- **Skeletons:** `HotelDetailSkeleton` renders panoramic shimmer and content placeholders during network fetch.
- **Buttons & Focus:** Interactive tap states with visible outline on keyboard navigation; `disabled` attribute set on sold-out state.
- **ARIA:** Semantic `<article>`, `<section>`, `role="dialog"`, `aria-modal="true"`, `aria-label` on back button and photo button.
- **Motion:** Responsive to `prefers-reduced-motion`.

---

## 8. Findings

None. Zero blockers.

---

## 9. Not Run / Blocked

- Real booking mutation E2E against backend database: **NOT RUN**. Milestone 3 is read-only hotel detail inspection; hold creation mutations begin in Milestone 4.

---

## 10. Verdict

**PASS**. Build passes, 45 tests pass, sold-out gate verified, zero backend modifications.
