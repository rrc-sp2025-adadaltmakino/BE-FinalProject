import { Request, Response, NextFunction } from "express";
import * as appointmentService from "../src/api/v1/services/appointmentServices";
import {
    getAllAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointment,
    deleteAppointment,
} from "../src/api/v1/controllers/appointmentController";

jest.mock("../src/api/v1/services/appointmentServices");
jest.mock("../config/firebaseConfig", () => ({ 
    db: { collection: jest.fn() },
    auth: { getUser: jest.fn() },
}));

const mockReq = (params = {}, body = {}) =>
    ({ params, body } as unknown as Request);

const mockRes = (uid = "user-001", role = "patient") => {
    const res = {
        locals: { uid, role },
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    return res;
};

const mockNext = jest.fn() as NextFunction;

describe("Appointment Controller", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("getAllAppointments", () => {
        it("should return 200 with appointments list", async () => {
            const appointments = [{ id: "a1", patientId: "user-001" }];
            (appointmentService.getAllAppointments as jest.Mock).mockResolvedValue(appointments);

            const req = mockReq();
            const res = mockRes();

            await getAllAppointments(req, res, mockNext);

            expect(appointmentService.getAllAppointments).toHaveBeenCalledWith("user-001", "patient");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: appointments }));
        });

        it("should call next(error) on failure", async () => {
            const error = new Error("Fetch failed");
            (appointmentService.getAllAppointments as jest.Mock).mockRejectedValue(error);

            await getAllAppointments(mockReq(), mockRes(), mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe("getAppointmentById", () => {
        it("should return 200 with a single appointment", async () => {
            const appointment = { id: "a1", patientId: "user-001" };
            (appointmentService.getAppointmentById as jest.Mock).mockResolvedValue(appointment);

            const req = mockReq({ id: "a1" });
            const res = mockRes();

            await getAppointmentById(req, res, mockNext);

            expect(appointmentService.getAppointmentById).toHaveBeenCalledWith("a1");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: appointment }));
        });

        it("should call next(error) on failure", async () => {
            const error = new Error("Not found");
            (appointmentService.getAppointmentById as jest.Mock).mockRejectedValue(error);

            await getAppointmentById(mockReq({ id: "a1" }), mockRes(), mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe("createAppointment", () => {
        it("should use token UID as patientId when role is patient", async () => {
            const newAppointment = { id: "a2", patientId: "user-001", doctorId: "doc-001" };
            (appointmentService.createAppointment as jest.Mock).mockResolvedValue(newAppointment);

            const req = mockReq({}, { doctorId: "doc-001", date: "2026-05-01", time: "10:00", notes: "checkup" });
            const res = mockRes("user-001", "patient");

            await createAppointment(req, res, mockNext);

            expect(appointmentService.createAppointment).toHaveBeenCalledWith({
                patientId: "user-001",
                doctorId: "doc-001",
                date: "2026-05-01",
                time: "10:00",
                notes: "checkup",
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: newAppointment }));
        });

        it("should use body patientId when role is admin", async () => {
            const newAppointment = { id: "a3", patientId: "patient-999", doctorId: "doc-001" };
            (appointmentService.createAppointment as jest.Mock).mockResolvedValue(newAppointment);

            const req = mockReq({}, {
                patientId: "patient-999",
                doctorId: "doc-001",
                date: "2026-05-01",
                time: "11:00",
            });
            const res = mockRes("admin-001", "admin");

            await createAppointment(req, res, mockNext);

            expect(appointmentService.createAppointment).toHaveBeenCalledWith({
                patientId: "patient-999",
                doctorId: "doc-001",
                date: "2026-05-01",
                time: "11:00",
                notes: undefined,
            });
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it("should return 400 when admin does not provide patientId", async () => {
            const req = mockReq({}, { doctorId: "doc-001", date: "2026-05-01", time: "10:00" });
            const res = mockRes("admin-001", "admin");

            await createAppointment(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Admin must provide patientId in the request body" })
            );
            expect(appointmentService.createAppointment).not.toHaveBeenCalled();
        });

        it("should call next(error) on service failure", async () => {
            const error = new Error("Create failed");
            (appointmentService.createAppointment as jest.Mock).mockRejectedValue(error);

            const req = mockReq({}, { doctorId: "doc-001", date: "2026-05-01", time: "10:00" });
            await createAppointment(req, mockRes("user-001", "patient"), mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe("updateAppointment", () => {
        it("should return 200 with the updated appointment", async () => {
            const updated = { id: "a1", status: "confirmed", notes: "updated" };
            (appointmentService.updateAppointment as jest.Mock).mockResolvedValue(updated);

            const req = mockReq({ id: "a1" }, { status: "confirmed", notes: "updated" });
            const res = mockRes();

            await updateAppointment(req, res, mockNext);

            expect(appointmentService.updateAppointment).toHaveBeenCalledWith("a1", {
                status: "confirmed",
                notes: "updated",
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: updated }));
        });

        it("should call next(error) on failure", async () => {
            const error = new Error("Update failed");
            (appointmentService.updateAppointment as jest.Mock).mockRejectedValue(error);

            await updateAppointment(mockReq({ id: "a1" }, {}), mockRes(), mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe("deleteAppointment", () => {
        it("should return 200 on successful deletion", async () => {
            (appointmentService.deleteAppointment as jest.Mock).mockResolvedValue(undefined);

            const req = mockReq({ id: "a1" });
            const res = mockRes();

            await deleteAppointment(req, res, mockNext);

            expect(appointmentService.deleteAppointment).toHaveBeenCalledWith("a1");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: {} }));
        });

        it("should call next(error) on failure", async () => {
            const error = new Error("Delete failed");
            (appointmentService.deleteAppointment as jest.Mock).mockRejectedValue(error);

            await deleteAppointment(mockReq({ id: "a1" }), mockRes(), mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});