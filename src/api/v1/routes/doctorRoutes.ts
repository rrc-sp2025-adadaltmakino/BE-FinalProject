import express, { Router } from 'express';
import { validateRequest } from '../middleware/validate';
import { doctorSchemas } from '../validations/doctorValidation';
import * as doctorController from '../controllers/doctorController';
import authenticate from '../middleware/authenticate';
import isAuthorized from '../middleware/authorize';

const router: Router = express.Router();

// GET /api/v1/doctors — any authenticated user can view all doctors
router.get(
  '/',
  authenticate,
  doctorController.getAllDoctors
);

// GET /api/v1/doctors/:id — any authenticated user can view a single doctor
router.get(
  '/:id',
  authenticate,
  validateRequest(doctorSchemas.getById),
  doctorController.getDoctorById
);

// POST /api/v1/doctors — admin only
router.post(
  '/',
  authenticate,
  isAuthorized({ hasRole: ['admin'] }),
  validateRequest(doctorSchemas.create),
  doctorController.createDoctor
);

// PUT /api/v1/doctors/:id — admin only
router.put(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin'] }),
  validateRequest(doctorSchemas.update),
  doctorController.updateDoctor
);

// DELETE /api/v1/doctors/:id — admin only
router.delete(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin'] }),
  validateRequest(doctorSchemas.delete),
  doctorController.deleteDoctor
);

export default router;