import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../../../constants/httpConstants"
import * as doctorService from "../services/doctorService";
import { Doctor } from "../models/doctorModel";
import { successResponse } from "../models/responseModel";


/**
 * Manages requests and reponses to retrieve all Doctors
 * @param req - The express Request
 * @param res  - The express Response
 * @param next - The express middleware chaining function
 */
export const getAllDoctors = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const doctors: Doctor[] = await doctorService.getAllDoctors();
        res.status(HTTP_STATUS.OK).json(
            successResponse(doctors, "Doctors successfully retrieved.")
        );
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Retrieves a single doctor by ID
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const getDoctorById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;
        const doctor: Doctor = await doctorService.getDoctorById(id);
        res.status(HTTP_STATUS.OK).json(
            successResponse(doctor, "Doctor retrieved successfully")
        );
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Manages requests, reponses, and validation to create a Doctor in the system
 * @param req - The express Request
 * @param res  - The express Response
 * @param next - The express middleware chaining function
 */
export const createDoctor = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { name, specialty, departmentId, availableDays, uid } = req.body;
        const doctorData = { name, specialty, departmentId, availableDays, uid };

        const newDoctor: Doctor = await doctorService.createDoctor(doctorData);
        res.status(HTTP_STATUS.CREATED).json(
            successResponse(newDoctor, "Doctor created successfully")
        );
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Manages requests and reponses to update a Doctor's information
 * @param req - The express Request
 * @param res  - The express Response
 * @param next - The express middleware chaining function
 */
export const updateDoctor = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { name, specialty, departmentId, availableDays } = req.body;
        const updatedData = { name, specialty, departmentId, availableDays };

        const updatedDoctor: Doctor = await doctorService.updateDoctor(id, updatedData);

        res.status(HTTP_STATUS.OK).json(
            successResponse(updatedDoctor, "Doctor information updated successfully")
        );
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Manages requests and reponses to delete a Doctor
 * @param req - The express Request
 * @param res  - The express Response
 * @param next - The express middleware chaining function
 */
export const deleteDoctor = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        await doctorService.deleteDoctor(id);
        res.status(HTTP_STATUS.OK).json(
            successResponse({}, "Doctor successfully deleted from the system")
        );
    } catch (error: unknown) {
        next(error);
    }
};
