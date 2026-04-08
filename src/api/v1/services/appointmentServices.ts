
import { db } from "../../../../config/firebaseConfig";
import {
    QuerySnapshot,
    DocumentData,
} from "firebase-admin/firestore";
import { Appointment } from "../models/appointmentModel";
import {
    createDocument,
    getDocuments,
    updateDocument,
    deleteDocument,
} from "../repositories/firestoreRepository";


const COLLECTION: string = "appointments";


/**
 * Retrieves all appointments from storage
 * @returns Array of all appointments
 */
export const getAllAppointments = async (): Promise<Appointment[]> => {
    try {
        const snapshot: QuerySnapshot = await getDocuments(COLLECTION);
        const appointments: Appointment[] = snapshot.docs.map((doc) => {
            const data: DocumentData = doc.data();
            return {
                id: data.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
            } as Appointment;
        });

        return appointments;
    } catch (error: unknown) {
        throw error;
    }
};

/**
 * Retrieves a single appointment by ID from the database
 * @param id - This ID of the appointment to retrieve
 * @returns The appointment if found
 */
export const getAppointmentById = async (id: string): Promise<Appointment> => {
    const snapshot: QuerySnapshot = await getDocuments(COLLECTION);
    const doc = snapshot.docs.find((d) => d.data().id === id);

    if (!doc) {
        throw new Error(`Loan Application with ID ${id} not found`);
    }

    const data: DocumentData = doc.data();
    const appointment: Appointment = {
        ...data,
    } as Appointment;

    return structuredClone(appointment);
};

/**
 * Creates a new Appointment
 * @param appointmentData - Appointment input data
 * @returns The created Appointment
 * @throws Error if doctor already booked at that time
 */
export const createAppointment = async (appointmentData: {
    patientId: string;
    doctorId: string;
    date: Date; 
    notes?: string;
}): Promise<Appointment> => {
    try {
        // Check for double-booking
        const conflict = await db
            .collection(COLLECTION)
            .where("doctorId", "==", appointmentData.doctorId)
            .where("date", "==", appointmentData.date)
            .where("status", "==", "confirmed")
            .get();

        if (!conflict.empty) {
            throw new Error("Doctor already has an appointment at this time");
        }

        const now = new Date();
        const newAppointmentData = {
            ...appointmentData,
            status: "pending" as const,
            createdAt: now,
            updatedAt: now,
        };

        const id = await createDocument<Appointment>(COLLECTION, newAppointmentData);
        return { id, ...newAppointmentData } as Appointment;
    } catch (error) {
        throw error;
    }
};


/**
 * Updates an existing appointment
 * @param id - The ID of the appointment to update
 * @param appointmentData - The fields to update
 * @returns The updated appointment
 * @throws Error if appointment is not found
 */
export const updateAppointment = async (
    id: string,
    appointmentData: Pick<Appointment, "status" | "notes">
): Promise<Appointment> => {
    // check if application exists first
    const appointment: Appointment = await getAppointmentById(id);
    if (!appointment) {
        throw new Error(`Appointment with ID ${id} not found`);
    }

    const updatedAppointment: Appointment = {
        ...appointment
    };

    if (appointmentData.status !== undefined) updatedAppointment.status = appointmentData.status;

    const snapshot: QuerySnapshot = await getDocuments(COLLECTION);
    const doc = snapshot.docs.find((d) => d.data().id === id);
    if (doc) {
        await updateDocument<Appointment>(COLLECTION, doc.id, updatedAppointment);
    }
 
    return structuredClone(updatedAppointment);
};

/**
 * Deletes an appointment from storage
 * @param id - The ID of the appointment to delete
 * @throws Error if appointment with given ID is not found
 */
export const deleteAppointment = async (id: string): Promise<void> => {
    // check if the item exists before deleting
    const appointment: Appointment = await getAppointmentById(id);
    if (!appointment) {
        throw new Error(`Appointment with ID ${id} not found`);
    }

    const snapshot: QuerySnapshot = await getDocuments(COLLECTION);
    const doc = snapshot.docs.find((d) => d.data().id === id);
    if (doc) {
        await deleteDocument(COLLECTION, doc.id);
    }
};
