import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
    });
};

// Appointment Booked
export const sendAppointmentConfirmation = async (
    patientEmail: string,
    doctorName: string,
    date: string
): Promise<void> => {
    const subject = "Appointment Confirmed";
    const html = `
        <h2>Your appointment is confirmed!</h2>
        <p>You have an appointment with <strong>${doctorName}</strong> on <strong>${date}</strong>.</p>
        <p>Please arrive 10 minutes early.</p>
    `;
    await sendEmail(patientEmail, subject, html);
};


// Appointment Cancelled
export const sendCancellationNotice = async (
    patientEmail: string,
    doctorName: string,
    date: string
): Promise<void> => {
    const subject = "Appointment Cancelled";
    const html = `
        <h2>Your appointment has been cancelled.</h2>
        <p>Your appointment with <strong>${doctorName}</strong> on <strong>${date}</strong> has been cancelled.</p>
        <p>Please book a new appointment if needed.</p>
    `;
    await sendEmail(patientEmail, subject, html);
};


// Doctor Confirms Appointment
export const sendAppointmentUpdateNotification = async (
    patientEmail: string,
    doctorName: string,
    date: string,
    status: string
): Promise<void> => {
    const subject = "Appointment Status Update";
    const html = `
        <h2>Your appointment status has been updated.</h2>
        <p>Your appointment with <strong>${doctorName}</strong> on <strong>${date}</strong> 
        is now <strong>${status}</strong>.</p>
    `;
    await sendEmail(patientEmail, subject, html);
};
