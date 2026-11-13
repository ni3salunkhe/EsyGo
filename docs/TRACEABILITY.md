# Requirement traceability (agent fills this in with REAL evidence)

Status values: NOT STARTED / IN PROGRESS / VERIFIED / FAILED. VERIFIED requires: the implementation location, the test IDs, and the
command + date of a real run that passed (or a pointer to the saved output). Never mark VERIFIED from reading code.
Requirement texts are from docs/00-assignment-verbatim.md.

| Req | Requirement | Design ref | Implementation (file) | Tests | Evidence (command, date, result) | Status |
|---|---|---|---|---|---|---|
| R-01 | Browse hotels: name, location, description, amenities, price/night | 02 s1 | | SRC-06 | | NOT STARTED |
| R-02 | Search by location and check-in/check-out | 02 s1, 03 | | SRC-01..05 | | NOT STARTED |
| R-03 | Hotel details and available rooms for the dates | 02 s2 | | SRC-05, SRC-07, SRC-08 | | NOT STARTED |
| R-04 | Book one room with name and email | 02 s3, 03 | | RES-01..05 | | NOT STARTED |
| R-05 | Total shown before confirming | 02 s1-3 | | PRC-01, RES-01, SRC-05 | | NOT STARTED |
| R-06 | Confirmation with unique reference | 02 s4, 01 s4 | | CNF-01, REF-01..03 | | NOT STARTED |
| R-07 | Retrieve booking by reference + email | 02 s5 | | GET-01..03 | | NOT STARTED |
| R-08 | Cancel a booking | 02 s6, 03 | | CAN-01..06 | | NOT STARTED |
| R-09 | Sample data for >= 5 hotels, single room category | 01 s1 | | DB-02 | | NOT STARTED |
| R-10 | Check-out after check-in | 02 s8 | | VAL-03, VAL-04 | | NOT STARTED |
| R-11 | Check-in not in the past | 02 s8 | | VAL-01, VAL-02 | | NOT STARTED |
| R-12 | Total computed on the backend (nights x price) | 02 s3 | | PRC-01, PRC-02 | | NOT STARTED |
| R-13 | Track availability per stay; no booking beyond capacity | 03 | | SRC-*, CONC-01..02 | | NOT STARTED |
| R-14 | Cancelled bookings release availability | 03 | | CAN-01, CAN-02 | | NOT STARTED |
| R-15 | Clear validation messages; graceful failures | 02 s7-8 | | VAL-*, API-01..04 | | NOT STARTED |
| R-16 | Document assumptions incl. overlapping stays | 01 s6, s11 | README.md | (doc review in audit) | | NOT STARTED |
| R-17 | Surprise feature + write-up (what/why/how) | 01 s9 | README.md + code | RES-01, EXP-*, CNF-04 | | NOT STARTED |
| R-18 | REST APIs with Spring Boot (frontend connection = phase 2) | 02 | | API-* | | NOT STARTED |
| R-19 | Persist hotel, availability, booking in MySQL | 01 s4 | | DB-01..03 | | NOT STARTED |
| R-20 | Clear code organization / separation of responsibilities | docs/06 F1 | | (audit F1) | | NOT STARTED |
| R-21 | Backend validation + consistent error responses | 02 s7-8 | | API-01..05 | | NOT STARTED |
| R-22 | DB setup instructions + sample data | 04 step 2 | README.md, db/seed.sql | DB-02, audit H1 | | NOT STARTED |
| R-23 | Meaningful automated tests: calculations + availability rules | 05 | | PRC-*, SRC-*, CONC-* | | NOT STARTED |
| R-24 | Credentials/secrets out of the repository | 01 s8 | | SEC-01, SEC-02 | | NOT STARTED |
