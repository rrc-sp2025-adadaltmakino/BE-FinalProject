
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
 * Fetches the patient's email address from Firebase Authentication
 * @param patientId - The Firebase UID of the patient
 * @returns The patient's email address, or null if unavailable
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
 * Fetches the doctor's name from the Firestore doctors collection
 * @param doctorId - The Firestore document ID of the doctor
 * @returns The doctor's name, or a fallback string if unavailable
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
 * Formats a Date into a readable string for email content
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
 * Retrieves all appointments from storage.
 * Admins receive all appointments; doctors and patients only see their own.
 * @param uid - The Firebase UID of the requesting user
 * @param role - The role of the requesting user (admin | doctor | patient)
 * @returns Array of Appointment objects
 */
export const getAllAppointments = async (
    uid: string,
    role: string
): Promise<Appointment[]> => {
    try {
        let snapshot: QuerySnapshot;

        if (role === "admin") {
            snapshot = await getDocuments(COLLECTION);
        } else {
            const field = role === "doctor" ? "doctorId" : "patientId";
            snapshot = await db
                .collection(COLLECTION)
                .where(field, "==", uid)
                .get();
        }

        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
            } as Appointment;
        });
    } catch (error: unknown) {
        throw error;
    }
};

/**
 * Retrieves a single appointment by ID from the database
 * @param id - The ID of the appointment to retrieve
 * @returns The Appointment if found
 * @throws Error if appointment is not found
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
 * Creates a new Appointment and sends a confirmation email to the patient.
 * @param appointmentData - Appointment input data
 * @returns The created Appointment
 * @throws Error if doctor already has a confirmed appointment at the given time
 */
export const createAppointment = async (appointmentData: {
    patientId: string;
    doctorId: string;
    date: Date;
    time: string;
    notes?: string;
}): Promise<Appointment> => {

    // Combine date + time into one Date object
    const [hours, minutes] = appointmentData.time.split(':').map(Number);
    const combinedDate = new Date(appointmentData.date);
    combinedDate.setHours(hours, minutes, 0, 0);

    // Reject if combined datetime is in the past
    if (combinedDate <= new Date()) {
        throw new Error('Appointment date and time must be in the future');
    }

    // Use combinedDate going forward
    const newAppointmentData = {
        ...appointmentData,
        date: combinedDate,
        status: "pending" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const id = await createDocument<Appointment>(COLLECTION, newAppointmentData);
    const newAppointment = { id, ...newAppointmentData } as Appointment;

    // Send confirmation email to the patient
    try {
        const [patientEmail, doctorName] = await Promise.all([
            getPatientEmail(appointmentData.patientId),
            getDoctorName(appointmentData.doctorId),
        ]);

        if (patientEmail) {
            await emailService.sendAppointmentConfirmation(
                patientEmail,
                doctorName,
                formatDate(appointmentData.date)
            );
        }
    } catch {
        // Email failure should not block appointment creation
    }

    return newAppointment;
};

/**
 * Updates an existing appointment and sends a status update email to the patient.
 * @param id - The ID of the appointment to update
 * @param appointmentData - The fields to update (status and/or notes)
 * @returns The updated Appointment
 * @throws Error if appointment is not found
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

    // Send update notification only when status actually changed
    if (appointmentData.status !== undefined && appointmentData.status !== previousStatus) {
        try {
            const [patientEmail, doctorName] = await Promise.all([
                getPatientEmail(appointment.patientId),
                getDoctorName(appointment.doctorId),
            ]);

            if (patientEmail) {
                await emailService.sendAppointmentUpdateNotification(
                    patientEmail,
                    doctorName,
                    formatDate(appointment.date),
                    updatedAppointment.status
                );
            }
        } catch {
            // Email failure should not block the update from being returned
        }
    }

    return structuredClone(updatedAppointment);
};

/**
 * Deletes an appointment from storage and sends a cancellation notice to the patient.
 * @param id - The ID of the appointment to delete
 * @throws Error if appointment with given ID is not found
 */
export const deleteAppointment = async (id: string): Promise<void> => {
    const appointment: Appointment = await getAppointmentById(id);

    await deleteDocument(COLLECTION, id);

    // Send cancellation notice to the patient
    try {
        const [patientEmail, doctorName] = await Promise.all([
            getPatientEmail(appointment.patientId),
            getDoctorName(appointment.doctorId),
        ]);

        if (patientEmail) {
            await emailService.sendCancellationNotice(
                patientEmail,
                doctorName,
                formatDate(appointment.date)
            );
        }
    } catch {
    }
};
