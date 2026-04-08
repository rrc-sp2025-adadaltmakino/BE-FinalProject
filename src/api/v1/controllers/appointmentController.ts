import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../../../constants/httpConstants"
import * as appointmentService from "../services/appointmentServices";
import { Appointment } from "../models/appointmentModel";
import { successResponse } from "../models/responseModel";


/**
 * Manages requests and reponses to retrieve all Appointments
 * @param req - The express Request
 * @param res  - The express Response
 * @param next - The express middleware chaining function
 */
export const getAllAppointments = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { uid, role } = res.locals;

        const appointments: Appointment[] = await appointmentService.getAllAppointments(uid, role);
        res.status(HTTP_STATUS.OK).json(
            successResponse(appointments, "Appointments successfully retrieved.")
        );
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Retrieves a single appointment by ID
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const getAppointmentById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;
        const appointment: Appointment = await appointmentService.getAppointmentById(id);
        res.status(HTTP_STATUS.OK).json(
            successResponse(appointment, "Appointment retrieved successfully")
        );
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Manages requests, reponses, and validation to create an Appointment in the system
 * @param req - The express Request
 * @param res  - The express Response
 * @param next - The express middleware chaining function
 */
export const createAppointment = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { uid } = res.locals;
        const { doctorId, date, notes } = req.body;
        const appointmentData = { patientId: uid, doctorId, date, notes };

        const newAppointment: Appointment = await appointmentService.createAppointment(appointmentData);
        res.status(HTTP_STATUS.CREATED).json(
            successResponse(newAppointment, "Appointment created successfully")
        );
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Manages requests and reponses to update an Appoinment
 * @param req - The express Request
 * @param res  - The express Response
 * @param next - The express middleware chaining function
 */
export const updateAppointment = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { status, notes } = req.body;
        const updatedData = { status, notes };

        const updatedAppointment: Appointment = await appointmentService.updateAppointment(id, updatedData);

        res.status(HTTP_STATUS.OK).json(
            successResponse(updatedAppointment, "Appointment updated successfully")
        );
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Manages requests and reponses to delete an Appointment (cancellation)
 * @param req - The express Request
 * @param res  - The express Response
 * @param next - The express middleware chaining function
 */
export const deleteAppointment = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        await appointmentService.deleteAppointment(id);
        res.status(HTTP_STATUS.OK).json(
            successResponse({}, "Appointment successfully deleted from the system")
        );
    } catch (error: unknown) {
        next(error);
    }
};
