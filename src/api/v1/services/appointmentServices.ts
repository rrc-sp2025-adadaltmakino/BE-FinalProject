import { db, auth } from "../../../../config/firebaseConfig";
import { QuerySnapshot } from "firebase-admin/firestore";
import { Appointment } from "../models/appointmentModel";
import {
    createDocument,
    getDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
} from "../repositories/firestoreRepository";
import * as emailService from './emailService';


const COLLECTION: string = "appointments";


/**
 * Generates a unique, human-readable appointment ID.
 * @returns A formatted ID string (e.g. "APT-001")
 */
const generateAppointmentId = async (): Promise<string> => {
    const snapshot = await db.collection(COLLECTION).get();
    const count = snapshot.size + 1;
    return `APT-${String(count).padStart(3, '0')}`;
};


/**
 * Converts a Firestore Timestamp, Date, string, or number to a JavaScript Date.
 * @param value - The value to convert
 * @returns A JavaScript Date object
 */
const toDate = (value: Date | { toDate: () => Date } | string | number): Date => {
    if (value instanceof Date) return value;
    if (value && typeof value === 'object' && 'toDate' in value) return value.toDate();
    return new Date(value as string | number);
};


/**
 * Looks up a patient's email address from Firebase Auth.
 * @param patientId - The Firebase Auth UID of the patient
 * @returns The patient's email address, or null if not found
 */
const getPatientEmail = async (patientId: string): Promise<string | null> => {
    try {
        const userRecord = await auth.getUser(patientId);
        return userRecord.email ?? null;
    } catch {
        return null;
    }
};


/**
 * Looks up a patient's display name from Firebase Auth.
 * @param patientId - The Firebase Auth UID of the patient
 * @returns The patient's display name, email, or "A patient" as fallback
 */
const getPatientName = async (patientId: string): Promise<string> => {
    try {
        const userRecord = await auth.getUser(patientId);
        return userRecord.displayName ?? userRecord.email ?? "A patient";
    } catch {
        return "A patient";
    }
};


/**
 * Looks up a doctor's display name from Firestore.
 * @param doctorId - The Firestore document ID of the doctor
 * @returns The doctor's name, or "Your doctor" as fallback
 */
const getDoctorName = async (doctorId: string): Promise<string> => {
    try {
        const doc = await getDocumentById("doctors", doctorId);
        return (doc?.data()?.name as string) ?? "Your doctor";
    } catch {
        return "Your doctor";
    }
};


/**
 * Looks up a doctor's email address via their linked Firebase Auth UID.
 * @param doctorId - The Firestore document ID of the doctor
 * @returns The doctor's email address, or null if not found
 */
const getDoctorEmail = async (doctorId: string): Promise<string | null> => {
    try {
        const doc = await getDocumentById("doctors", doctorId);
        const uid = doc?.data()?.uid as string;
        if (!uid) return null;
        const userRecord = await auth.getUser(uid);
        return userRecord.email ?? null;
    } catch {
        return null;
    }
};


/**
 * Formats a Date into a human-readable string in the America/Winnipeg timezone.
 * @param date - The date to format
 * @returns A formatted date string (e.g. "Friday, April 25, 2026 at 10:30 AM CDT")
 */
const formatDate = (date: Date): string =>
    new Date(date).toLocaleString("en-US", {
        timeZone: "America/Winnipeg",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    });


// Service functions -------------------------------------------------


/**
 * Retrieves appointments based on the user's role.
 * Admins receive all appointments; doctors and patients receive only their own.
 * @param uid - The Firebase Auth UID of the requesting user
 * @param role - The role of the requesting user ("admin", "doctor", or "patient")
 * @returns Array of Appointment objects
 */
export const getAllAppointments = async (
    uid: string,
    role: string
): Promise<Appointment[]> => {
    let snapshot: QuerySnapshot;

    if (role === "admin") {
        snapshot = await getDocuments(COLLECTION);
    } else {
        const field = role === "doctor" ? "doctorId" : "patientId";
        snapshot = await db.collection(COLLECTION).where(field, "==", uid).get();
    }

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
        } as Appointment;
    });
};


/**
 * Retrieves a single appointment by its ID.
 * @param id - The ID of the appointment to retrieve
 * @returns The Appointment object if found
 * @throws Error if no appointment exists with the given ID
 */
export const getAppointmentById = async (id: string): Promise<Appointment> => {
    const doc = await getDocumentById(COLLECTION, id);

    if (!doc) {
        throw new Error(`Appointment with ID ${id} not found`);
    }

    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate?.() ?? data?.createdAt,
    } as Appointment;
};


/**
 * Creates a new appointment and sends email notifications to the patient and doctor.
 * Email failures are silently caught and do not block the appointment from being created.
 * @param appointmentData - The data for the new appointment
 * @param appointmentData.patientId - Firebase Auth UID of the patient
 * @param appointmentData.doctorId - Firestore document ID of the doctor
 * @param appointmentData.date - The date of the appointment
 * @param appointmentData.time - The time of the appointment (HH:MM format)
 * @param appointmentData.notes - Optional notes for the appointment
 * @returns The newly created Appointment object
 * @throws Error if the appointment date and time are not in the future
 */
export const createAppointment = async (appointmentData: {
    patientId: string;
    doctorId: string;
    date: Date;
    time: string;
    notes?: string;
}): Promise<Appointment> => {

    const dateOnly = new Date(appointmentData.date).toISOString().slice(0, 10);
    const combinedDate = new Date(`${dateOnly}T${appointmentData.time}:00`);

    if (combinedDate <= new Date()) {
        throw new Error('Appointment date and time must be in the future');
    }

    const newAppointmentData = {
        ...appointmentData,
        date: combinedDate,
        status: "pending" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const id = await createDocument<Appointment>(COLLECTION, newAppointmentData, await generateAppointmentId());
    const newAppointment = { id, ...newAppointmentData } as Appointment;

    try {
        const [patientEmail, doctorEmail, doctorName, patientName] = await Promise.all([
            getPatientEmail(appointmentData.patientId),
            getDoctorEmail(appointmentData.doctorId),
            getDoctorName(appointmentData.doctorId),
            getPatientName(appointmentData.patientId),
        ]);

        const formattedDate = formatDate(combinedDate);

        if (patientEmail) {
            await emailService.sendAppointmentConfirmation(patientEmail, doctorName, formattedDate);
        }
        if (doctorEmail) {
            await emailService.sendDoctorNewAppointmentNotice(doctorEmail, patientName, formattedDate);
        }
    } catch {

    }

    return newAppointment;
};


/**
 * Updates an existing appointment's status and/or notes.
 * Sends email notifications to both patient and doctor if the status changed.
 * Email failures are silently caught and do not block the update.
 * @param id - The ID of the appointment to update
 * @param appointmentData - The fields to update (status and/or notes)
 * @returns The updated Appointment object
 * @throws Error if no appointment exists with the given ID
 */
export const updateAppointment = async (
    id: string,
    appointmentData: Pick<Appointment, "status" | "notes">
): Promise<Appointment> => {
    const appointment: Appointment = await getAppointmentById(id);
    const previousStatus = appointment.status;

    const updatedAppointment: Appointment = { ...appointment };

    if (appointmentData.status !== undefined) updatedAppointment.status = appointmentData.status;
    if (appointmentData.notes !== undefined) updatedAppointment.notes = appointmentData.notes;

    await updateDocument<Appointment>(COLLECTION, id, updatedAppointment);

    if (appointmentData.status !== undefined && appointmentData.status !== previousStatus) {
        try {
            const [patientEmail, doctorEmail, doctorName, patientName] = await Promise.all([
                getPatientEmail(appointment.patientId),
                getDoctorEmail(appointment.doctorId),
                getDoctorName(appointment.doctorId),
                getPatientName(appointment.patientId),
            ]);

            const formattedDate = formatDate(toDate(appointment.date));

            if (patientEmail) {
                await emailService.sendAppointmentUpdateNotification(patientEmail, doctorName, formattedDate, updatedAppointment.status);
            }
            if (doctorEmail) {
                await emailService.sendDoctorAppointmentUpdate(doctorEmail, patientName, formattedDate, updatedAppointment.status);
            }
        } catch {

        }
    }

    return structuredClone(updatedAppointment);
};


/**
 * Deletes an appointment and sends cancellation email notifications to both patient and doctor.
 * Email failures are silently caught and do not block the deletion.
 * @param id - The ID of the appointment to delete
 * @returns void
 * @throws Error if no appointment exists with the given ID
 */
export const deleteAppointment = async (id: string): Promise<void> => {
    const appointment: Appointment = await getAppointmentById(id);

    await deleteDocument(COLLECTION, id);

    try {
        const [patientEmail, doctorEmail, doctorName, patientName] = await Promise.all([
            getPatientEmail(appointment.patientId),
            getDoctorEmail(appointment.doctorId),
            getDoctorName(appointment.doctorId),
            getPatientName(appointment.patientId),
        ]);

        const formattedDate = formatDate(toDate(appointment.date));

        if (patientEmail) {
            await emailService.sendCancellationNotice(patientEmail, doctorName, formattedDate);
        }
        if (doctorEmail) {
            await emailService.sendDoctorCancellationNotice(doctorEmail, patientName, formattedDate);
        }
    } catch {
    }
};