# Clinic Appointment Booking API
 
A RESTful API for managing clinic appointments, doctors, and departments.

Using: Node.js, TypeScript, Express, and Firebase Firestore.

Patients can book appointments, doctors can manage schedules, and admins can oversee
all clinic operations


## Technologies

- Node.js, TypeScript, Express
- Firebase Firestore and Authentication
- Jest for testing
- Swagger/OpenAPI for documentation
- Joi for validation
- GitHub for version control and project management


## Architecture
- Routes layer
- Controllers layer
- Services layer
- Repositories layer


## API Endpoints

### Auth
- POST /auth/register - Register a new user (public)
- POST /auth/login - Login and receive token (public)

### Doctors
- GET /doctors - Get all doctors (public)
- GET /doctors/:id - Get a doctor by ID (public)
- POST /doctors - Create a new doctor (admin)
- PUT /doctors/:id - Update a doctor (admin, doctor)
- DELETE /doctors/:id - Delete a doctor (admin)

### Appointments
- GET /appointments - Get all appointments (admin)
- GET /appointments/:id - Get appointment by ID (admin, doctor, patient)
- POST /appointments - Book an appointment (patient)
- PUT /appointments/:id - Update appointment status (doctor, admin)
- DELETE /appointments/:id - Cancel an appointment (patient, admin)



## Roles and Permissions
- Manage all resources: admin
- View/Update own schedule: doctor | patient
- Book appointments: admin | patients
- View appointments: admin | doctor | patient
- Cancel own appointments: admin | patients


## New component: NodeMailer
NodeMailer will be used for email notifications.
- Patient books new appointment (confirmation email)
- An appointment is cancelled (cancellation notice)
- Doctor confirms an appointment (update notification)


## Git Workflow

- `main` — production-ready, polished code only,  "final product" branch
- `development` — stable ongoing work
- `feature` — individual features branched from `development`

# Author: Amanda Dadalt Makino