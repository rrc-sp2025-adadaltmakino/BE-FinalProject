import express, { Router } from 'express';
import { validateRequest } from '../middleware/validate';
import { doctorSchemas } from '../validations/doctorValidation';
import * as doctorController from '../controllers/doctorController';
import authenticate from '../middleware/authenticate';
import isAuthorized from '../middleware/authorize';

const router: Router = express.Router();

/**
 * @openapi
 * /doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: Doctors successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get(
  '/',
  authenticate,
  doctorController.getAllDoctors
);

/**
 * @openapi
 * /doctors/{id}:
 *   get:
 *     summary: Get a doctor by ID
 *     tags: [Doctors]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The doctor ID
 *     responses:
 *       200:
 *         description: Doctor retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       404:
 *         description: Doctor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:id',
  authenticate,
  validateRequest(doctorSchemas.getById),
  doctorController.getDoctorById
);

/**
 * @openapi
 * /doctors:
 *   post:
 *     summary: Create a new doctor (admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - specialty
 *               - availableDays
 *               - uid
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dr. Jones
 *               specialty:
 *                 type: string
 *                 example: Cardiology
 *               availableDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Monday", "Wednesday"]
 *               uid:
 *                 type: string
 *                 example: firebase-uid-001
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient role
 */
router.post(
  '/',
  authenticate,
  isAuthorized({ hasRole: ['admin', 'doctor'] }),
  validateRequest(doctorSchemas.create),
  doctorController.createDoctor
);

/**
 * @openapi
 * /doctors/{id}:
 *   put:
 *     summary: Update a doctor's information (admin or doctor)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dr. Smith
 *               specialty:
 *                 type: string
 *                 example: Neurology
 *               availableDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Tuesday", "Thursday"]
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       404:
 *         description: Doctor not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient role
 */
router.put(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin'] }),
  validateRequest(doctorSchemas.update),
  doctorController.updateDoctor
);

/**
 * @openapi
 * /doctors/{id}:
 *   delete:
 *     summary: Delete a doctor (admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The doctor ID
 *     responses:
 *       200:
 *         description: Doctor successfully deleted
 *       404:
 *         description: Doctor not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient role
 */
router.delete(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin'] }),
  validateRequest(doctorSchemas.delete),
  doctorController.deleteDoctor
);

export default router;