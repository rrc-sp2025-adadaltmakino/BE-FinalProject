import express, { Router } from "express";
import authenticate from "../middleware/authenticate";
import isAuthorized from "../middleware/authorize";
import { validateRequest } from "../middleware/validate";
import { appointmentSchemas } from "../validations/appointmentValidation";
import * as appointmentController from "../controllers/appointmentController";

const router: Router = express.Router();

// GET /api/v1/appointments — admin and doctor only (patients cannot browse all appointments)
router.get(
  '/',
  authenticate,
  isAuthorized({ hasRole: ['admin', 'doctor'] }),
  appointmentController.getAllAppointments
);

// GET /api/v1/appointments/:id — admin, doctor, or the patient who owns it (allowSameUser)
router.get(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin', 'doctor'], allowSameUser: true }),
  validateRequest(appointmentSchemas.getById),
  appointmentController.getAppointmentById
);

// POST /api/v1/appointments — any authenticated user (patient books their own appointment)
router.post(
  '/',
  authenticate,
  validateRequest(appointmentSchemas.create),
  appointmentController.createAppointment
);

// PUT /api/v1/appointments/:id — admin, doctor, or the patient who owns it
router.put(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin', 'doctor'], allowSameUser: true }),
  validateRequest(appointmentSchemas.update),
  appointmentController.updateAppointment
);

// DELETE /api/v1/appointments/:id — admin only
router.delete(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin'] }),
  validateRequest(appointmentSchemas.delete),
  appointmentController.deleteAppointment
);

export default router;