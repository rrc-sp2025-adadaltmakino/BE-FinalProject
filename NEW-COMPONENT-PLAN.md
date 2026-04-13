# New Component Research and Planning

## Selected Component: NodeMailer


## What is NodeMailer?

NodeMailer is an npm package that lets you send emails from a Node.js application.
It connects to an SMTP email provider (like Gmail or SendGrid) and sends emails
from your server. It supports HTML emails and works well with TypeScript.


## Why I Chose NodeMailer

For this project, I wanted to add email notifications to improve the experience
for patients and doctors using the clinic API. After looking into a few options,
I decided NodeMailer was the best fit because:

- It's the most popular email library for Node.js with lots of documentation
- It supports TypeScript out of the box with `@types/nodemailer`
- It's easy to set up and configure with environment variables
- It can be fully mocked in Jest tests so we don't send real emails during testing
- It has no production dependencies, keeping the project lightweight


## New Files I Plan to Add

src/api/v1/services/emailService.ts -> email sending functions
config/emailConfig.ts -> sets up the nodemailer transporter
test/emailService.test.ts -> Jest tests with nodemailer mocked


## Implementation Steps

1. Install nodemailer: `npm install nodemailer` and `npm install --save-dev @types/nodemailer`
2. Create `emailConfig.ts` to set up the transporter using environment variables
3. Create `emailService.ts` with three functions:
   - `sendAppointmentConfirmation()`
   - `sendCancellationNotice()`
   - `sendAppointmentUpdateNotification()`
4. Call these functions inside `appointmentServices.ts` after successful DB writes
5. Write unit tests mocking nodemailer so no real emails are sent during testing