import * as doctorService from "../src/api/v1/services/doctorService";
import * as firestoreRepository from "../src/api/v1/repositories/firestoreRepository";
import { db } from "../config/firebaseConfig";

jest.mock("../src/api/v1/repositories/firestoreRepository");
jest.mock("../config/firebaseConfig", () => ({
    db: { collection: jest.fn() },
    auth: { getUser: jest.fn() },
}));

// Reusable db chain mock for generateDoctorId: db.collection().get()
const mockDbQuery = {
    get: jest.fn(),
};

describe("Doctor Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockDbQuery.get.mockResolvedValue({ size: 0 });
        (db.collection as jest.Mock).mockReturnValue(mockDbQuery);
    });

    describe("createDoctor", () => {
        it("should create a doctor successfully", async () => {
            const mockData = {
                name: "Dr. Jane Smith",
                specialty: "Cardiology",
                departmentId: "dept-001",
                availableDays: ["Monday", "Wednesday", "Friday"],
                uid: "firebase-uid-123",
            };
            const mockDocumentId = "doctor-xyz789";
            (firestoreRepository.createDocument as jest.Mock).mockResolvedValue(mockDocumentId);

            const result = await doctorService.createDoctor(mockData);

            expect(firestoreRepository.createDocument).toHaveBeenCalled();
            expect(result).toHaveProperty("id", mockDocumentId);
            expect(result).toHaveProperty("name", "Dr. Jane Smith");
        });

        it("should throw an error if the repository fails", async () => {
            const mockData = {
                name: "Dr. Jane Smith",
                specialty: "Cardiology",
                departmentId: "dept-001",
                availableDays: ["Monday"],
                uid: "firebase-uid-123",
            };
            (firestoreRepository.createDocument as jest.Mock).mockRejectedValue(
                new Error("Firestore write failed")
            );

            await expect(doctorService.createDoctor(mockData)).rejects.toThrow("Firestore write failed");
        });
    });

    describe("getDoctorById", () => {
        it("should return doctor data when found", async () => {
            const mockId = "doctor-001";
            const mockDoc = {
                id: mockId,
                exists: true,
                data: () => ({
                    name: "Dr. John Doe",
                    specialty: "Neurology",
                    departmentId: "dept-002",
                    availableDays: ["Tuesday", "Thursday"],
                    uid: "firebase-uid-456",
                    createdAt: { toDate: () => new Date() },
                }),
            };
            (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(mockDoc);

            const result = await doctorService.getDoctorById(mockId);

            expect(firestoreRepository.getDocumentById).toHaveBeenCalledWith(expect.any(String), mockId);
            expect(result).toHaveProperty("id", mockId);
            expect(result).toHaveProperty("name", "Dr. John Doe");
        });

        it("should throw an error when the doctor is not found", async () => {
            (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(null);

            await expect(doctorService.getDoctorById("nonexistent-id")).rejects.toThrow("not found");
        });
    });

    describe("getAllDoctors", () => {
        it("should return all doctors", async () => {
            const mockSnapshot = {
                docs: [
                    {
                        id: "doc-001",
                        data: () => ({
                            name: "Dr. A",
                            specialty: "Cardiology",
                            departmentId: "dept-001",
                            availableDays: ["Monday"],
                            uid: "uid-001",
                            createdAt: { toDate: () => new Date() },
                        }),
                    },
                    {
                        id: "doc-002",
                        data: () => ({
                            name: "Dr. B",
                            specialty: "Neurology",
                            departmentId: "dept-002",
                            availableDays: ["Wednesday"],
                            uid: "uid-002",
                            createdAt: { toDate: () => new Date() },
                        }),
                    },
                ],
            };
            (firestoreRepository.getDocuments as jest.Mock).mockResolvedValue(mockSnapshot);

            const result = await doctorService.getAllDoctors();

            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty("id", "doc-001");
        });

        it("should throw an error if the repository fails", async () => {
            (firestoreRepository.getDocuments as jest.Mock).mockRejectedValue(new Error("Permission denied"));

            await expect(doctorService.getAllDoctors()).rejects.toThrow("Permission denied");
        });
    });

    describe("updateDoctor", () => {
        it("should update a doctor and return the updated data", async () => {
            const mockId = "doctor-001";
            const updateData = {
                name: "Dr. Jane Smith",
                specialty: "Pediatric Cardiology",
                departmentId: "dept-001",
                availableDays: ["Tuesday", "Thursday"],
            };
            const mockUpdatedDoc = {
                id: mockId,
                exists: true,
                data: () => ({
                    name: "Dr. Jane Smith",
                    specialty: "Pediatric Cardiology",
                    departmentId: "dept-001",
                    availableDays: ["Tuesday", "Thursday"],
                    uid: "firebase-uid-123",
                    createdAt: { toDate: () => new Date() },
                }),
            };

            (firestoreRepository.updateDocument as jest.Mock).mockResolvedValue(undefined);
            (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(mockUpdatedDoc);

            const result = await doctorService.updateDoctor(mockId, updateData);

            expect(firestoreRepository.updateDocument).toHaveBeenCalledWith(
                expect.any(String),
                mockId,
                expect.objectContaining(updateData)
            );
            expect(result).toHaveProperty("specialty", "Pediatric Cardiology");
        });

        it("should throw an error if the doctor does not exist", async () => {
            (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(null);

            await expect(
                doctorService.updateDoctor("ghost-id", {
                    name: "Dr. X",
                    specialty: "Cardiology",
                    availableDays: ["Monday"],
                })
            ).rejects.toThrow("not found");
        });
    });

    describe("deleteDoctor", () => {
        it("should delete a doctor successfully", async () => {
            const mockId = "doc-001";
            const mockDoc = {
                exists: true,
                data: () => ({
                    name: "Dr. A",
                    specialty: "Cardiology",
                    availableDays: ["Monday"],
                    uid: "uid-001",
                }),
            };
            (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(mockDoc);
            (firestoreRepository.deleteDocument as jest.Mock).mockResolvedValue(undefined);

            await expect(doctorService.deleteDoctor(mockId)).resolves.not.toThrow();
            expect(firestoreRepository.deleteDocument).toHaveBeenCalledWith(expect.any(String), mockId);
        });

        it("should throw an error if the doctor does not exist", async () => {
            (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(null);

            await expect(doctorService.deleteDoctor("ghost-id")).rejects.toThrow("not found");
        });
    });
});