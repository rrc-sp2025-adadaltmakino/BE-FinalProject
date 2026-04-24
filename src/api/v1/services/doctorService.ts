import { db } from "../../../../config/firebaseConfig";
import { Doctor } from "../models/doctorModel";
import {
    createDocument,
    getDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
} from "../repositories/firestoreRepository";


const COLLECTION = "doctors";


/**
 * Generates a unique, human-readable doctor ID.
 * @returns A formatted ID string (e.g. "DR-001")
 */
const generateDoctorId = async (): Promise<string> => {
    const snapshot = await db.collection(COLLECTION).get();
    const count = snapshot.size + 1;
    return `DR-${String(count).padStart(3, '0')}`;
};


/**
 * Retrieves all doctors from the database.
 * @returns Array of all Doctor objects
 */
export const getAllDoctors = async (): Promise<Doctor[]> => {
    const snapshot = await getDocuments(COLLECTION);
    const doctors: Doctor[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Doctor;
    });
    return doctors;
};


/**
 * Retrieves a single doctor by their ID.
 * @param id - The ID of the doctor to retrieve
 * @returns The Doctor object if found
 * @throws Error if no doctor exists with the given ID
 */
export const getDoctorById = async (id: string): Promise<Doctor> => {
    const doc = await getDocumentById(COLLECTION, id);
    if (!doc) {
        throw new Error(`Doctor with ID ${id} not found`);
    }
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
    } as Doctor;
};


/**
 * Creates a new doctor in the database with an auto-generated ID.
 * @param doctorData - The data for the new doctor
 * @param doctorData.name - Full name of the doctor
 * @param doctorData.specialty - Medical specialty
 * @param doctorData.availableDays - Days of the week the doctor is available
 * @param doctorData.uid - Firebase Auth UID linked to this doctor
 * @returns The newly created Doctor object with generated ID and timestamps
 */
export const createDoctor = async (doctorData: {
    name: string;
    specialty: string;
    availableDays: string[];
    uid: string;
}): Promise<Doctor> => {
    const now = new Date();
    const newDoctorData = { ...doctorData, createdAt: now, updatedAt: now };
    const id = await createDocument<Doctor>(COLLECTION, newDoctorData, await generateDoctorId());
    return { id, ...newDoctorData } as Doctor;
};


/**
 * Updates an existing doctor's profile fields.
 * @param id - The ID of the doctor to update
 * @param doctorData - The fields to update (name, specialty, availableDays)
 * @returns The updated Doctor object
 * @throws Error if no doctor exists with the given ID
 */
export const updateDoctor = async (
    id: string,
    doctorData: Pick<Doctor, "name" | "specialty" | "availableDays">
): Promise<Doctor> => {
    const updateData = { ...doctorData, updatedAt: new Date() };
    await updateDocument<Doctor>(COLLECTION, id, updateData);
    return await getDoctorById(id);
};


/**
 * Deletes a doctor from the database.
 * @param id - The ID of the doctor to delete
 * @returns void
 * @throws Error if no doctor exists with the given ID
 */
export const deleteDoctor = async (id: string): Promise<void> => {
    const doc = await getDocumentById(COLLECTION, id);
    if (!doc) {
        throw new Error(`Doctor with ID ${id} not found`);
    }
    await deleteDocument(COLLECTION, id);
};