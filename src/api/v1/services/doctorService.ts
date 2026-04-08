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
 * Retrieves all doctors from storage
 * @returns Array of all doctors
 */
export const getAllDoctors = async (): Promise<Doctor[]> => {
    try {
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
    } catch (error: unknown) {
        throw error;
    }
};

/**
 * Retrieves a single doctor by ID from the database
 * @param id - This ID of the doctor to retrieve
 * @returns The doctor if found
 */
export const getDoctorById = async (id: string): Promise<Doctor> => {
    try {
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
    } catch (error) {
        throw error;
    }
};

/**
 * Creates a new Doctor
 * @param doctorData - The data for the new doctor
 * @returns The created Doctor with generated ID
 */
export const createDoctor = async (doctorData: {
    name: string;
    specialty: string;
    departmentId: string;
    availableDays: string[];
    uid: string;
}): Promise<Doctor> => {
    try {
        const now = new Date();
        const newDoctorData = { ...doctorData, createdAt: now, updatedAt: now };
        const id = await createDocument<Doctor>(COLLECTION, newDoctorData);
        return { id, ...newDoctorData } as Doctor;
    } catch (error) {
        throw error;
    }
};


/**
 * Updates (replaces) an existing doctor
 * @param id - The ID of the doctor to update
 * @param doctorData - The fields to updates 
 * @returns The updated doctor
 * @throws Error if doctor with given ID is not found
 */
export const updateDoctor = async (
    id: string,
    doctorData: Pick<Doctor, "name" | "specialty" | "departmentId" | "availableDays">
): Promise<Doctor> => {
    try {
        const updateData = { ...doctorData, updatedAt: new Date() };
        await updateDocument<Doctor>(COLLECTION, id, updateData);
        return await getDoctorById(id);
    } catch (error) {
        throw error;
    }
};

/**
 * Deletes a doctor from storage
 * @param id - The ID of the doctor to delete
 * @throws Error if doctor with given ID is not found
 */
export const deleteDoctor = async (id: string): Promise<void> => {
    try {
        const doc = await getDocumentById(COLLECTION, id);
        if (!doc) {
            throw new Error(`Doctor with ID ${id} not found`);
        }
        await deleteDocument(COLLECTION, id);
    } catch (error) {
        throw error;
    }
};