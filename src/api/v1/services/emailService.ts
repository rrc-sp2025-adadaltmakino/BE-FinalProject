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


// Patient Emails -----------------------------------------------------------

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


// Doctor Emails ------------------------------------------------------------

export const sendDoctorNewAppointmentNotice = async (
    doctorEmail: string,
    patientName: string,
    date: string
): Promise<void> => {
    const subject = "New Appointment Booked";
    const html = `
        <h2>You have a new appointment!</h2>
        <p>Patient <strong>${patientName}</strong> has booked an appointment on <strong>${date}</strong>.</p>
        <p>Please review your schedule.</p>
    `;
    await sendEmail(doctorEmail, subject, html);
};

export const sendDoctorAppointmentUpdate = async (
    doctorEmail: string,
    patientName: string,
    date: string,
    status: string
): Promise<void> => {
    const subject = "Appointment Status Updated";
    const html = `
        <h2>An appointment status has changed.</h2>
        <p>The appointment with <strong>${patientName}</strong> on <strong>${date}</strong> 
        is now <strong>${status}</strong>.</p>
    `;
    await sendEmail(doctorEmail, subject, html);
};

export const sendDoctorCancellationNotice = async (
    doctorEmail: string,
    patientName: string,
    date: string
): Promise<void> => {
    const subject = "Appointment Cancelled";
    const html = `
        <h2>An appointment has been cancelled.</h2>
        <p>The appointment with <strong>${patientName}</strong> on <strong>${date}</strong> has been cancelled.</p>
    `;
    await sendEmail(doctorEmail, subject, html);
};