import { Request, Response, NextFunction } from "express";
import { UserRecord } from "firebase-admin/auth";
import { auth } from "../../../../config/firebaseConfig";
import { successResponse } from "../models/responseModel";

const OK: number = 200;

/**
 * Handles retrieving user details.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>}
 */
export const getUserDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const { id } = req.params;

    try {
        const user: UserRecord = await auth.getUser(String(id));
        res.status(OK).json(successResponse(user));
    } catch (error) {
        next(error);
    }
};