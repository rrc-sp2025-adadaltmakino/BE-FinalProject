import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../../../constants/httpConstants"
import * as appointmentService from "../services/appointmentServices";
import { Appointment } from "../models/appointmentModel";
import { successResponse } from "../models/responseModel";


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


export const createAppointment = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { uid, role } = res.locals;
        const { doctorId, date, time, notes, patientId: bodyPatientId } = req.body;

        // Admins provide patientId in the body; patients use their own token UID
        const patientId = role === 'admin' ? bodyPatientId : uid;

        if (!patientId) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: role === 'admin'
                    ? 'Admin must provide patientId in the request body': 'Unauthorized'
            });
            return;
        }

        const appointmentData = { patientId, doctorId, date, time, notes };
        const newAppointment: Appointment = await appointmentService.createAppointment(appointmentData);
        res.status(HTTP_STATUS.CREATED).json(
            successResponse(newAppointment, "Appointment created successfully")
        );
    } catch (error: unknown) {
        next(error);
    }
};


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