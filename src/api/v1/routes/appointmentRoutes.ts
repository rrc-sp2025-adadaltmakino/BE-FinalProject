import express, { Router } from "express";
import authenticate from "../middleware/authenticate";
import isAuthorized from "../middleware/authorize";
import { validateRequest } from "../middleware/validate";
import { appointmentSchemas } from "../validations/appointmentValidation";
import * as appointmentController from "../controllers/appointmentController";

const router: Router = express.Router();


// GET /appointments — any authenticated user
router.get(
    "/",
    authenticate,
    appointmentController.getAllAppointments
);

// GET /appointments/:id — any authenticated user
router.get(
    "/:id",
    authenticate,
    validateRequest(appointmentSchemas.getById),
    appointmentController.getAppointmentById
);

// POST /appointments — patient, admin, or doctor can book
router.post(
    "/",
    authenticate,
    isAuthorized({ hasRole: ["admin", "doctor", "patient"] }),
    validateRequest(appointmentSchemas.create),
    appointmentController.createAppointment
);

// PUT /appointments/:id — admin or the same user who booked
router.put(
    "/:id",
    authenticate,
    isAuthorized({ hasRole: ["admin"], allowSameUser: true }),
    validateRequest(appointmentSchemas.update),
    appointmentController.updateAppointment
);

// DELETE /appointments/:id — admin only
router.delete(
    "/:id",
    authenticate,
    isAuthorized({ hasRole: ["admin"] }),
    validateRequest(appointmentSchemas.getById),
    appointmentController.deleteAppointment
);

export default router;