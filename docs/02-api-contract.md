# API contract (FROZEN) - base path `/api`, JSON, no authentication

Tags as in docs/01. Dates are ISO `yyyy-MM-dd`; instants are ISO-8601 UTC (`2026-12-01T10:15:30Z`) [DEFAULT].
Omitted-vs-null: fields marked (dates only) are OMITTED (not null) when no dates were supplied [DEFAULT].

## 1. GET /api/hotels?location=&checkIn=&checkOut=
Browse mode (no dates) [DERIVED from requirement "Browse hotels"; semantics DEFAULT]: all hotels, optionally
filtered by `location` (case-insensitive exact match [DEFAULT]), ordered by name.
Search mode (BOTH dates present): only hotels with at least one available room for `[checkIn, checkOut)`.
Exactly one date present -> 400 VALIDATION_ERROR.
200:
```json
[{ "id": 1, "name": "...", "location": "Goa", "address": "...", "description": "...",
   "imageUrl": null, "amenities": ["Pool", "Wi-Fi"], "pricePerNight": 4000.00,
   "availableRooms": 2, "nights": 2, "totalAmount": 8000.00 }]
```
`availableRooms`, `nights`, `totalAmount` are (dates only). No results -> 200 with `[]`.

## 2. GET /api/hotels/{hotelId}?checkIn=&checkOut=
Same hotel object as above (plus all amenities). Dates optional, both-or-neither. With dates it still
returns 200 when `availableRooms` is 0 so the UI can show "sold out". Unknown id -> 404 NOT_FOUND.

## 3. POST /api/bookings   (reserve = start the 10-minute hold)
Request: `{ "hotelId": 1, "checkIn": "2026-12-10", "checkOut": "2026-12-12", "guestName": "A B", "guestEmail": "a@b.io" }`
201 + `Location` header `/api/bookings/{reference}`:
```json
{ "reference": "HB-7K3Q9X", "status": "HELD", "hotelId": 1, "hotelName": "...", "roomNumber": "101",
  "guestName": "A B", "guestEmail": "a@b.io", "checkIn": "2026-12-10", "checkOut": "2026-12-12",
  "nights": 2, "pricePerNight": 4000.00, "totalAmount": 8000.00,
  "expiresAt": "2026-12-01T10:15:30Z", "createdAt": "2026-12-01T10:05:30Z" }
```
Errors: 400 VALIDATION_ERROR, 404 NOT_FOUND (hotel), 409 SOLD_OUT, 409 CONCURRENCY_CONFLICT.
The total is always computed by the backend (`nights x price_per_night`); any client-sent total is ignored/rejected.

## 4. POST /api/bookings/{reference}/confirm   body `{ "email": "a@b.io" }`
200 with the booking object (`status: CONFIRMED`, `expiresAt` omitted/null).
Already CONFIRMED -> 200 (idempotent). Hold lapsed -> 409 HOLD_EXPIRED. CANCELLED/EXPIRED -> 409 INVALID_STATE.
Unknown reference OR wrong email -> 404 NOT_FOUND (identical response for both, so existence is not leaked).

## 5. GET /api/bookings/{reference}?email=
200 booking object. Unknown reference or wrong email -> 404 NOT_FOUND (identical). Email comparison is
case-insensitive and trimmed [DEFAULT]. A HELD booking whose deadline just passed may still read HELD until the
next expiry-job run (<= ~60 s) - documented limitation.

## 6. POST /api/bookings/{reference}/cancel   body `{ "email": "a@b.io" }`
200 with the booking (`CANCELLED`). Already CANCELLED -> 200 (idempotent). EXPIRED -> 409 INVALID_STATE.
`check_in <= today` -> 409 INVALID_STATE with a clear message (no cancelling once the stay has started).
Wrong reference/email -> 404 NOT_FOUND.

## 7. Error body (ALL non-2xx responses, no exceptions)
```json
{ "timestamp": "2026-12-01T10:05:30Z", "status": 409, "code": "SOLD_OUT",
  "message": "No rooms available for the selected dates.",
  "fieldErrors": [ { "field": "checkOut", "message": "must be after checkIn" } ] }
```
`fieldErrors` is always present (empty array when not applicable). Never expose stack traces, SQL, class names.
| code | HTTP | when |
|---|---|---|
| VALIDATION_ERROR | 400 | bad/missing field, malformed JSON, bad date order, past check-in, > max-nights, outside window, one-date search |
| NOT_FOUND | 404 | unknown hotel; unknown reference or wrong email; unknown route |
| SOLD_OUT | 409 | no room has all nights available |
| HOLD_EXPIRED | 409 | confirm after the hold deadline |
| INVALID_STATE | 409 | transition not allowed from the current status |
| CONCURRENCY_CONFLICT | 409 | reserve deadlocked again after the single retry [DEFAULT] |
| INTERNAL_ERROR | 500 | anything unexpected (generic message; details only in server logs) |

## 8. Validation rules (reserve and search)
- `checkIn >= today` (today = injectable Clock in the configured zone); `checkOut > checkIn`.
- `nights <= app.booking.max-nights` [DEFAULT]; `checkOut <= today + app.inventory.window-days` so every night has inventory.
- `guestName`: non-blank after trim, 1-100 chars. `guestEmail`: valid format, <= 150 chars, stored trimmed/lower-cased [DEFAULT].
- `hotelId` must exist. Messages must be specific ("checkOut must be after checkIn"), never "invalid request".
- Do not log guest emails or full query strings containing emails.
