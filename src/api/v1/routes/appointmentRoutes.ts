import express, { Router } from "express";
import authenticate from "../middleware/authenticate";
import isAuthorized from "../middleware/authorize";
import { validateRequest } from "../middleware/validate";
import { appointmentSchemas } from "../validations/appointmentValidation";
import * as appointmentController from "../controllers/appointmentController";

const router: Router = express.Router();

/**
 * @openapi
 * /appointments:
 *   get:
 *     summary: Get all appointments (role-filtered)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     description: Admins see all appointments. Doctors and patients only see their own.
 *     responses:
 *       200:
 *         description: Appointments successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticate,
  isAuthorized({ hasRole: ['admin'] }),
  appointmentController.getAllAppointments
);

/**
 * @openapi
 * /appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The appointment ID
 *     responses:
 *       200:
 *         description: Appointment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin', 'doctor', 'patient'] }),
  validateRequest(appointmentSchemas.getById),
  appointmentController.getAppointmentById
);

/**
 * @openapi
 * /appointments:
 *   post:
 *     summary: Book a new appointment (patient only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - date
 *             properties:
 *               doctorId:
 *                 type: string
 *                 example: doc-001
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-01T10:00:00Z"
 *               notes:
 *                 type: string
 *                 example: Regular checkup
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Validation error or double-booking conflict
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient role
 */
router.post(
  '/',
  authenticate,
  isAuthorized({ hasRole: ['patient'] }),
  validateRequest(appointmentSchemas.create),
  appointmentController.createAppointment
);

/**
 * @openapi
 * /appointments/{id}:
 *   put:
 *     summary: Update an appointment status or notes (doctor or admin)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled]
 *                 example: confirmed
 *               notes:
 *                 type: string
 *                 example: Patient needs follow-up
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient role
 */
router.put(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin', 'doctor'] }),
  validateRequest(appointmentSchemas.update),
  appointmentController.updateAppointment
);

/**
 * @openapi
 * /appointments/{id}:
 *   delete:
 *     summary: Cancel an appointment (patient or admin)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The appointment ID
 *     responses:
 *       200:
 *         description: Appointment successfully deleted
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient role
 */
router.delete(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin', 'patient'] }),
  validateRequest(appointmentSchemas.delete),
  appointmentController.deleteAppointment
);

export default router;