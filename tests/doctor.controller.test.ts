import { Request, Response, NextFunction } from "express";
import * as doctorService from "../src/api/v1/services/doctorService";
import {
    getAllDoctors,
    getDoctorById,
    createDoctor,
    updateDoctor,
    deleteDoctor,
} from "../src/api/v1/controllers/doctorController";

jest.mock("../src/api/v1/services/doctorService");

const mockReq = (params = {}, body = {}) =>
    ({ params, body } as unknown as Request);

const mockRes = () => {
    const res = {
        locals: { uid: "admin-001", role: "admin" },
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    return res;
};

const mockNext = jest.fn() as NextFunction;

describe("Doctor Controller", () => {
    beforeEach(() => jest.clearAllMocks());


    describe("getAllDoctors", () => {
        it("should return 200 with doctors list", async () => {
            const doctors = [{ id: "doc-001", name: "Dr. Smith" }];
            (doctorService.getAllDoctors as jest.Mock).mockResolvedValue(doctors);

            const res = mockRes();
            await getAllDoctors(mockReq(), res, mockNext);

            expect(doctorService.getAllDoctors).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ data: doctors })
            );
        });

        it("should call next(error) on failure", async () => {
            (doctorService.getAllDoctors as jest.Mock).mockRejectedValue(new Error("Fetch failed"));

            await getAllDoctors(mockReq(), mockRes(), mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });
    });


    describe("getDoctorById", () => {
        it("should return 200 with a single doctor", async () => {
            const doctor = { id: "doc-001", name: "Dr. Smith" };
            (doctorService.getDoctorById as jest.Mock).mockResolvedValue(doctor);

            const res = mockRes();
            await getDoctorById(mockReq({ id: "doc-001" }), res, mockNext);

            expect(doctorService.getDoctorById).toHaveBeenCalledWith("doc-001");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ data: doctor })
            );
        });

        it("should call next(error) on failure", async () => {
            (doctorService.getDoctorById as jest.Mock).mockRejectedValue(new Error("Not found"));

            await getDoctorById(mockReq({ id: "doc-001" }), mockRes(), mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });
    });


    describe("createDoctor", () => {
        it("should return 201 with the created doctor", async () => {
            const newDoctor = { id: "doc-002", name: "Dr. Jones" };
            (doctorService.createDoctor as jest.Mock).mockResolvedValue(newDoctor);

            const body = {
                name: "Dr. Jones",
                specialty: "Cardiology",
                availableDays: ["Monday"],
                uid: "uid-002",
            };
            const res = mockRes();
            await createDoctor(mockReq({}, body), res, mockNext);

            expect(doctorService.createDoctor).toHaveBeenCalledWith(body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ data: newDoctor })
            );
        });

        it("should call next(error) on failure", async () => {
            (doctorService.createDoctor as jest.Mock).mockRejectedValue(new Error("Create failed"));

            await createDoctor(mockReq({}, {}), mockRes(), mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });
    });


    describe("updateDoctor", () => {
        it("should return 200 with the updated doctor", async () => {
            const updated = { id: "doc-001", name: "Dr. Smith Updated" };
            (doctorService.updateDoctor as jest.Mock).mockResolvedValue(updated);

            const body = {
                name: "Dr. Smith Updated",
                specialty: "Neurology",
                availableDays: ["Tuesday"],
            };
            const res = mockRes();
            await updateDoctor(mockReq({ id: "doc-001" }, body), res, mockNext);

            expect(doctorService.updateDoctor).toHaveBeenCalledWith("doc-001", body);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ data: updated })
            );
        });

        it("should call next(error) on failure", async () => {
            (doctorService.updateDoctor as jest.Mock).mockRejectedValue(new Error("Update failed"));

            await updateDoctor(mockReq({ id: "doc-001" }, {}), mockRes(), mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });
    });


    describe("deleteDoctor", () => {
        it("should return 200 on successful deletion", async () => {
            (doctorService.deleteDoctor as jest.Mock).mockResolvedValue(undefined);

            const res = mockRes();
            await deleteDoctor(mockReq({ id: "doc-001" }), res, mockNext);

            expect(doctorService.deleteDoctor).toHaveBeenCalledWith("doc-001");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ data: {} })
            );
        });

        it("should call next(error) on failure", async () => {
            (doctorService.deleteDoctor as jest.Mock).mockRejectedValue(new Error("Delete failed"));

            await deleteDoctor(mockReq({ id: "doc-001" }), mockRes(), mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});