# Clinic Appointment Booking API
 
A RESTful API for managing clinic appointments, doctors, and departments built with 
Node.js, TypeScript, Express, and Firebase Firestore.

> Patients can book appointments, doctors can manage their schedules, and admins can oversee all clinic operations.

## Technologies

| Category | Technology |
|---|---|
| Runtime & Language | Node.js, TypeScript |
| Framework | Express |
| Database & Auth | Firebase Firestore, Firebase Authentication |
| Email Notifications | NodeMailer |
| Validation | Joi |
| Testing | Jest, Supertest |
| API Documentation | Swagger / OpenAPI |
| Version Control | GitHub |


## Architecture
| Layer | Responsibility |
|---|---|
| **Routes** | Define API endpoints and attach middleware |
| **Middleware** | Handle authentication, authorization, and request validation |
| **Controllers** | Parse requests, call services, return responses |
| **Services** | Contain core business logic |
| **Repositories** | Abstract all Firestore database interactions |



## API Endpoints

### Doctors
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/doctors` | Get all doctors | Public |
| `GET` | `/doctors/:id` | Get a doctor by ID | Public |
| `POST` | `/doctors` | Create a new doctor | Admin |
| `PUT` | `/doctors/:id` | Update a doctor | Admin, Doctor |
| `DELETE` | `/doctors/:id` | Delete a doctor | Admin |

### Appointments
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/appointments` | Get all appointments | Admin |
| `GET` | `/appointments/:id` | Get appointment by ID | Admin, Doctor, Patient |
| `POST` | `/appointments` | Book an appointment | Admin, Patient |
| `PUT` | `/appointments/:id` | Update appointment status | Admin, Doctor |
| `DELETE` | `/appointments/:id` | Cancel an appointment | Admin, Patient |

### Other
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/health` | Server health check | Public |

## Roles and Permissions
- Manage all resources: admin
- View/Update own schedule: doctor | patient
- Book appointments: admin | patients
- View appointments: admin | doctor | patient
- Cancel own appointments: admin | patients


## New component: Email Notifications (NodeMailer)

Automated emails are triggered on the following events:

- **Booking Confirmation** — sent to patient when a new appointment is booked
- **Cancellation Notice** — sent when an appointment is cancelled
- **Status Update** — sent when a doctor confirms or updates an appointment


## Git Workflow

- `main` — production-ready, polished code only,  "final product" branch
- `development` — stable ongoing work
- `feature` — individual features branched from `development`

## API Documentation

Swagger UI available at:

```
http://localhost:3000/api-docs
```

## To Fix/Improve:
- make patient profile
- make separate departments for each doctor specialty

# Author: Amanda Dadalt Makino
