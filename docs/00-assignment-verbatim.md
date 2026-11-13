# Assignment (verbatim) - highest authority

Nothing in this pack may contradict this text. If a pack document and this text
disagree, this text wins and the disagreement must be reported (raise-blocker skill).

---

Interview Assignment: Hotel Booking Portal
Build a simple hotel booking portal that demonstrates your understanding of full-stack development, database design, and problem-solving. Include one surprise feature of your choice that makes the experience more useful or interesting.

Technology stack
- Backend: Java with Spring Boot
- Frontend: React
- Database: MySQL

1. Core requirements
Your application should allow a user to:
- Browse hotels with their name, location, description, amenities, and room price per night.
- Search hotels by location and select check-in and check-out dates.
- View hotel details and available rooms for the selected dates.
- Book one room by providing their name and email address.
- See the total booking amount before confirming.
- Receive a booking confirmation with a unique booking reference.
- Retrieve a booking using its reference and email address, and cancel it.
Use sample data for at least five hotels. A single room category per hotel is sufficient.

2. Booking rules
- Check-out must be after check-in, and check-in cannot be in the past.
- Calculate the total amount on the backend using the number of nights and the room price.
- Track room availability for the selected stay and prevent bookings beyond available capacity.
- Cancelled bookings should release the reserved availability.
- Show clear validation messages and handle failures gracefully.
Document your assumptions, including how overlapping stays are handled.

3. Surprise feature
Add one feature beyond the core requirements. You decide what it is.
It should solve a user problem or add a thoughtful touch to the booking experience. A small, well-executed idea is better than a large, incomplete feature.
In your write-up, explain:
- What the feature does.
- Why you chose it.
- How you implemented it.

4. Technical expectations
- Build REST APIs using Spring Boot and connect them to your frontend.
- Persist hotel, room availability, and booking data in MySQL.
- Organize your code clearly, with appropriate separation of responsibilities.
- Include backend validation and consistent API error responses.
- Provide database setup instructions and sample data.
- Include a few meaningful automated tests for booking calculations and availability rules.
- Keep credentials and secrets out of the repository.
Authentication, payment integration, an admin panel, and cloud deployment are not required.

---

## Additional constraints from the project owner (Nitin)
- Phase 1 is the BACKEND only (Spring Boot + MySQL). The React frontend comes later.
- Follow the final design in docs/01-final-design.md exactly.
- No deployments. No CI/CD. No pushing to any remote.
- Work must be accurate, tested and audited. No assumptions, no fake or "seeded" results.
- Commit timely, with clean commits, from the very first step.
