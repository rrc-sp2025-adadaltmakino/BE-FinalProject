import * as appointmentService from "../src/api/v1/services/appointmentServices";
import * as firestoreRepository from "../src/api/v1/repositories/firestoreRepository";
import { db } from "../config/firebaseConfig";

jest.mock("../src/api/v1/repositories/firestoreRepository");
jest.mock("../config/firebaseConfig", () => ({
    db: { collection: jest.fn() },
    auth: { getUser: jest.fn() },
}));

const makeMockDoc = (id: string, data: object) => ({
    id,
    exists: true,
    data: () => ({ ...data, createdAt: { toDate: () => new Date() } }),
});

describe("Appointment Service", () => {
    const mockDbQuery = {
        where: jest.fn(),
        get: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockDbQuery.where.mockReturnValue(mockDbQuery);
        mockDbQuery.get.mockResolvedValue({ empty: true, docs: [] });
        (db.collection as jest.Mock).mockReturnValue(mockDbQuery);
    });

    describe("createAppointment", () => {
        it("should create an appointment successfully", async () => {
            const mockData = {
                patientId: "patient-001",
                doctorId: "doctor-001",
                date: new Date("2026-06-10"), 
                time: "10:00",
                notes: "Annual check-up",
            };
            mockDbQuery.get.mockResolvedValue({ empty: true });
            (firestoreRepository.createDocument as jest.Mock).mockResolvedValue("appointment-abc123");

            const result = await appointmentService.createAppointment(mockData);

            expect(firestoreRepository.createDocument).toHaveBeenCalled();
            expect(result).toHaveProperty("id", "appointment-abc123");
            expect(result).toHaveProperty("patientId", "patient-001");
            expect(result).toHaveProperty("status", "pending");
        });

        it("should throw if appointment date is in the past", async () => {
            const mockData = {
                patientId: "patient-001",
                doctorId: "doctor-001",
                date: new Date("2024-01-01"), 
                time: "10:00",
            };

            await expect(appointmentService.createAppointment(mockData)).rejects.toThrow(
                "Appointment date and time must be in the future"
            );
            expect(firestoreRepository.createDocument).not.toHaveBeenCalled();
        });

        it("should throw if createDocument fails", async () => {
            const mockData = {
                patientId: "patient-001",
                doctorId: "doctor-001",
                date: new Date("2026-06-10"), 
                time: "10:00",
            };
            mockDbQuery.get.mockResolvedValue({ empty: true });
            (firestoreRepository.createDocument as jest.Mock).mockRejectedValue(
                new Error("Firestore write failed")
            );

            await expect(appointmentService.createAppointment(mockData)).rejects.toThrow("Firestore write failed");
        });
    });

    describe("getAppointmentById", () => {
        it("should return appointment data when found", async () => {
            const mockId = "appointment-001";
            const mockDoc = makeMockDoc(mockId, {
                patientId: "patient-001",
                doctorId: "doctor-001",
                date: new Date("2026-06-10"),
                status: "pending",
            });
            (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(mockDoc);

            const result = await appointmentService.getAppointmentById(mockId);

            expect(firestoreRepository.getDocumentById).toHaveBeenCalledWith(expect.any(String), mockId);
            expect(result).toHaveProperty("id", mockId);
            expect(result).toHaveProperty("patientId", "patient-001");
        });

        it("should throw an error when appointment is not found", async () => {
            (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(null);

            await expect(appointmentService.getAppointmentById("nonexistent-id")).rejects.toThrow("not found");
        });
    });

    describe("getAllAppointments", () => {
        it("should return all appointments for an admin", async () => {
            const mockSnapshot = {
                docs: [
                    makeMockDoc("appt-001", { patientId: "patient-001", doctorId: "doctor-001", date: new Date() }),
                    makeMockDoc("appt-002", { patientId: "patient-002", doctorId: "doctor-002", date: new Date() }),
                ],
            };
            (firestoreRepository.getDocuments as jest.Mock).mockResolvedValue(mockSnapshot);

            const result = await appointmentService.getAllAppointments("admin-user", "admin");

            expect(firestoreRepository.getDocuments).toHaveBeenCalled();
            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty("id", "appt-001");
        });

        it("should filter by patientId for a patient role", async () => {
            const uid = "user-456";
            const mockSnapshot = {
                docs: [makeMockDoc("appt-001", { patientId: uid, doctorId: "doc-001", date: new Date() })],
            };
            mockDbQuery.get.mockResolvedValue(mockSnapshot);

            const result = await appointmentService.getAllAppointments(uid, "patient");

            expect(db.collection).toHaveBeenCalledWith("appointments");
            expect(mockDbQuery.where).toHaveBeenCalledWith("patientId", "==", uid);
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty("id", "appt-001");
        });

        it("should filter by doctorId for a doctor role", async () => {
            const uid = "doc-uid-123";
            const mockSnapshot = {
                docs: [makeMockDoc("appt-001", { patientId: "p-001", doctorId: uid, date: new Date() })],
            };
            mockDbQuery.get.mockResolvedValue(mockSnapshot);

            const result = await appointmentService.getAllAppointments(uid, "doctor");

            expect(mockDbQuery.where).toHaveBeenCalledWith("doctorId", "==", uid);
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty("id", "appt-001");
        });

        it("should throw an error if the admin repository call fails", async () => {
            (firestoreRepository.getDocuments as jest.Mock).mockRejectedValue(new Error("Firestore unavailable"));

            await expect(
                appointmentService.getAllAppointments("user-123", "admin")
            ).rejects.toThrow("Firestore unavailable");
        });
    });

    describe("deleteAppointment", () => {
        it("should delete an appointment successfully", async () => {
            const mockId = "appt-001";
            const mockDoc = makeMockDoc(mockId, {
                patientId: "p-001",
                doctorId: "doctor-001",
                date: new Date("2026-06-10"),
                status: "pending",
            });

            (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(mockDoc);
            (firestoreRepository.getDocuments as jest.Mock).mockResolvedValue({ docs: [mockDoc] });
            (firestoreRepository.deleteDocument as jest.Mock).mockResolvedValue(undefined);

            await expect(appointmentService.deleteAppointment(mockId)).resolves.not.toThrow();
            expect(firestoreRepository.deleteDocument).toHaveBeenCalledWith(expect.any(String), mockId);
        });

        it("should throw an error if appointment does not exist", async () => {
            (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(null);

            await expect(appointmentService.deleteAppointment("ghost-id")).rejects.toThrow("not found");
        });
    });
});