import express, { Router } from "express";
import authenticate from "../middleware/authenticate";
import isAuthorized from "../middleware/authorize";
import { validateRequest } from "../middleware/validate";
import { appointmentSchemas } from "../validations/appointmentValidation";
import * as appointmentController from "../controllers/appointmentController";

const router: Router = express.Router();

// GET /api/v1/appointments — admin only (patients cannot browse all appointments)
router.get(
  '/',
  authenticate,
  isAuthorized({ hasRole: ['admin'] }),
  appointmentController.getAllAppointments
);

// GET /api/v1/appointments/:id — admin, doctor, or the patient who owns it (allowSameUser)
router.get(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin', 'doctor', 'patient'] }),
  validateRequest(appointmentSchemas.getById),
  appointmentController.getAppointmentById
);

// POST /api/v1/appointments — any authenticated user (patient books their own appointment)
router.post(
  '/',
  authenticate,
  isAuthorized({ hasRole: ['patient'] }),
  validateRequest(appointmentSchemas.create),
  appointmentController.createAppointment
);

// PUT /api/v1/appointments/:id — admin, doctor
router.put(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin', 'doctor'] }),
  validateRequest(appointmentSchemas.update),
  appointmentController.updateAppointment
);

// DELETE /api/v1/appointments/:id — admin only
router.delete(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin', 'patient'] }),
  validateRequest(appointmentSchemas.delete),
  appointmentController.deleteAppointment
);

export default router;