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

const generateAppointmentId = async (): Promise<string> => {
    const snapshot = await db.collection(COLLECTION).get();
    const count = snapshot.size + 1;
    return `APT-${String(count).padStart(3, '0')}`;
};

const toDate = (value: any): Date => {
    if (value instanceof Date) return value;
    if (value?.toDate) return value.toDate();
    return new Date(value);
};

const getPatientEmail = async (patientId: string): Promise<string | null> => {
    try {
        const userRecord = await auth.getUser(patientId);
        return userRecord.email ?? null;
    } catch {
        return null;
    }
};

const getPatientName = async (patientId: string): Promise<string> => {
    try {
        const userRecord = await auth.getUser(patientId);
        return userRecord.displayName ?? userRecord.email ?? "A patient";
    } catch {
        return "A patient";
    }
};

const getDoctorName = async (doctorId: string): Promise<string> => {
    try {
        const doc = await getDocumentById("doctors", doctorId);
        return (doc?.data()?.name as string) ?? "Your doctor";
    } catch {
        return "Your doctor";
    }
};

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
    } catch (error: unknown) {
        throw error;
    }
};

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