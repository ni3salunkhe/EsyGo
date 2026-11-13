# Requirement traceability (agent fills this in with REAL evidence)

Status values: NOT STARTED / IN PROGRESS / VERIFIED / FAILED. VERIFIED requires: the implementation location, the test IDs, and the
command + date of a real run that passed (or a pointer to the saved output). Never mark VERIFIED from reading code.
Requirement texts are from docs/00-assignment-verbatim.md.

| Req | Requirement | Design ref | Implementation (file) | Tests | Evidence (command, date, result) | Status |
|---|---|---|---|---|---|---|
| R-01 | Browse hotels: name, location, description, amenities, price/night | 02 s1 | backend/src/main/java/com/hotelbooking/controller/HotelController.java, service/HotelService.java, dto/HotelResponse.java | SRC-06 | mvn test -f backend/pom.xml (HotelControllerIntegrationTest: SRC-06), 2026-11-13 (PASS) | VERIFIED |
| R-02 | Search by location and check-in/check-out | 02 s1, 03 | backend/src/main/java/com/hotelbooking/controller/HotelController.java, service/HotelService.java, repository/RoomNightRepository.java | SRC-01..05 | mvn test -f backend/pom.xml (HotelControllerIntegrationTest: SRC-01..05), 2026-11-13 (PASS) | VERIFIED |
| R-03 | Hotel details and available rooms for the dates | 02 s2 | backend/src/main/java/com/hotelbooking/controller/HotelController.java, service/HotelService.java | SRC-05, SRC-07, SRC-08 | mvn test -f backend/pom.xml (HotelControllerIntegrationTest: SRC-05, SRC-07, SRC-08), 2026-11-13 (PASS) | VERIFIED |
| R-04 | Book one room with name and email | 02 s3, 03 | backend/src/main/java/com/hotelbooking/controller/BookingController.java, service/BookingService.java, service/BookingTransactionalService.java | RES-01..05 | mvn test -f backend/pom.xml (ReserveIntegrationTest: RES-01..05), 2026-11-13 (PASS) | VERIFIED |
| R-05 | Total shown before confirming | 02 s1-3 | backend/src/main/java/com/hotelbooking/service/PricingService.java, service/HotelService.java, service/BookingTransactionalService.java | PRC-01, RES-01, SRC-05 | mvn test -f backend/pom.xml (PricingServiceTest, HotelControllerIntegrationTest, ReserveIntegrationTest), 2026-11-13 (PASS) | VERIFIED |
| R-06 | Confirmation with unique reference | 02 s4, 01 s4 | backend/src/main/java/com/hotelbooking/service/ReferenceGenerator.java | REF-01..03 | mvn clean test (ReferenceGeneratorTest: format, 10k exclusion check, retry), 2026-11-13 (PASS) | VERIFIED |
| R-07 | Retrieve booking by reference + email | 02 s5 | | GET-01..03 | | NOT STARTED |
| R-08 | Cancel a booking | 02 s6, 03 | | CAN-01..06 | | NOT STARTED |
| R-09 | Sample data for >= 5 hotels, single room category | 01 s1 | db/seed.sql | DB-02 | mvn clean test (DB-02), 2026-11-13, 5 hotels, 25 rooms, 8 amenities (PASS) | VERIFIED |
| R-10 | Check-out after check-in | 02 s8 | backend/src/main/java/com/hotelbooking/service/BookingValidator.java | VAL-03, VAL-04 | mvn clean test (BookingValidatorTest: VAL-03, VAL-04), 2026-11-13 (PASS) | VERIFIED |
| R-11 | Check-in not in the past | 02 s8 | backend/src/main/java/com/hotelbooking/service/BookingValidator.java | VAL-01, VAL-02 | mvn clean test (BookingValidatorTest: VAL-01, VAL-02), 2026-11-13 (PASS) | VERIFIED |
| R-12 | Total computed on the backend (nights x price) | 02 s3 | backend/src/main/java/com/hotelbooking/service/PricingService.java | PRC-01, PRC-02 | mvn clean test (PricingServiceTest: PRC-01, PRC-02), 2026-11-13 (PASS) | VERIFIED |
| R-13 | Track availability per stay; no booking beyond capacity | 03 | backend/src/main/java/com/hotelbooking/repository/RoomNightRepository.java, service/BookingTransactionalService.java | SRC-01..05, CONC-01..02 | mvn test -f backend/pom.xml (BookingConcurrencyTest CONC-01, CONC-02), 2026-11-13 (PASS) | VERIFIED |
| R-14 | Cancelled bookings release availability | 03 | | CAN-01, CAN-02 | | NOT STARTED |
| R-15 | Clear validation messages; graceful failures | 02 s7-8 | backend/src/main/java/com/hotelbooking/service/BookingValidator.java, controller/GlobalExceptionHandler.java | VAL-*, SRC-08, API-01..04 | mvn test -f backend/pom.xml (VAL-*, SRC-08, API contract), 2026-11-13 (PASS) | IN PROGRESS |
| R-16 | Document assumptions incl. overlapping stays | 01 s6, s11 | README.md | (doc review in audit) | | NOT STARTED |
| R-17 | Surprise feature + write-up (what/why/how) | 01 s9 | README.md + code | RES-01, EXP-*, CNF-04 | | NOT STARTED |
| R-18 | REST APIs with Spring Boot (frontend connection = phase 2) | 02 | backend/src/main/java/com/hotelbooking/controller/HotelController.java | SRC-*, API-* | mvn test -f backend/pom.xml (HotelControllerIntegrationTest), 2026-11-13 (PASS) | IN PROGRESS |
| R-19 | Persist hotel, availability, booking in MySQL | 01 s4 | db/schema.sql, backend/src/main/java/com/hotelbooking/service/InventoryInitializer.java | DB-01..03 | mvn clean test (DB-01, DB-02, DB-03), 2026-11-13 (PASS) | VERIFIED |
| R-20 | Clear code organization / separation of responsibilities | docs/06 F1 | com.hotelbooking.* (controller, service, repository, domain, dto, exception, config) | (audit F1) | Layered architecture strictly followed, 2026-11-13 | IN PROGRESS |
| R-21 | Backend validation + consistent error responses | 02 s7-8 | backend/src/main/java/com/hotelbooking/controller/GlobalExceptionHandler.java, service/BookingValidator.java | VAL-09, SRC-08, API-01..05 | mvn test -f backend/pom.xml, 2026-11-13 (PASS) | IN PROGRESS |
| R-22 | DB setup instructions + sample data | 04 step 2 | README.md, db/seed.sql | DB-02, audit H1 | Followed instructions literally on hotel_booking and scripts/verify-invariants.sh, 2026-11-13 (PASS) | VERIFIED |
| R-23 | Meaningful automated tests: calculations + availability rules | 05 | | PRC-*, SRC-*, CONC-* | mvn test -f backend/pom.xml (66 tests passing incl. CONC-01, CONC-02, RES-01..05), 2026-11-13 (PASS) | VERIFIED |
| R-24 | Credentials/secrets out of the repository | 01 s8 | .gitignore, backend/src/main/resources/application.properties, .env.example | SEC-01, SEC-02 | git check-ignore .env backend/target/, git log -p grep, 2026-11-13 (PASS) | VERIFIED |
