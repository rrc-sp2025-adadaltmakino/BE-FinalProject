### Sprint Demo Structure

## Current Progress 

# What's already built and working:

- Authentication and Authorization — In Firebase a token-based auth with authenticate middleware

- Role-Based Access — isAuthorized middleware (admin, doctor, patient roles)

- Doctors CRUD — GET /doctors, POST /doctors, PUT /doctors/:id, DELETE /doctors/:id

- Appointments CRUD — GET /appointments, POST /appointments, PUT /appointments/:id, DELETE /appointments/:id

- Postman working


# New Component Highlights — NodeMailer

- What it does: Sends email notifications automatically when appointments are booked, confirmed, or cancelled

- How it enhances the app: Patients and doctors no longer have to check the app manually

- Challenges: Testing email without sending real emails


# Next Steps 

- Finish NodeMailer integration for all 3 triggers (book, confirm, cancel)

- Add Swagger/OpenAPI documentation

# To Fix/Improve:

- able to book appointment before current date

- make ID's more readable?

- add time in the appointment

- update appointment require notes? add reason for appointment?
