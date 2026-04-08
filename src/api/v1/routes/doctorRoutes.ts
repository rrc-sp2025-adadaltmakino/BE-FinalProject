import express, { Router } from "express";
import authenticate from "../middleware/authenticate";
import isAuthorized from "../middleware/authorize";
import { validateRequest } from "../middleware/validate";
import { doctorSchemas } from "../validations/doctorValidation";
import * as doctorController from "../controllers/doctorController";

const router: Router = express.Router();

// GET /doctors — any authenticated user
router.get(
    "/",
    authenticate,
    doctorController.getAllDoctors
);

// GET /doctors/:id — any authenticated user
router.get(
    "/:id",
    authenticate,
    validateRequest(doctorSchemas.getById),
    doctorController.getDoctorById
);

// POST /doctors — admin only
router.post(
    "/",
    authenticate,
    isAuthorized({ hasRole: ["admin"] }),
    validateRequest(doctorSchemas.create),
    doctorController.createDoctor
);

// PUT /doctors/:id — admin only
router.put(
    "/:id",
    authenticate,
    isAuthorized({ hasRole: ["admin"] }),
    validateRequest(doctorSchemas.update),
    doctorController.updateDoctor
);

// DELETE /doctors/:id — admin only
router.delete(
    "/:id",
    authenticate,
    isAuthorized({ hasRole: ["admin"] }),
    validateRequest(doctorSchemas.getById),
    doctorController.deleteDoctor
);

export default router;