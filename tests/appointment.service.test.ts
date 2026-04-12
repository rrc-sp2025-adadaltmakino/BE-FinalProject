import * as appointmentService from "../src/api/v1/services/appointmentServices";
import * as firestoreRepository from "../src/api/v1/repositories/firestoreRepository";
import { db } from "../config/firebaseConfig";

jest.mock("../src/api/v1/repositories/firestoreRepository");
jest.mock("../config/firebaseConfig", () => ({
  db: { collection: jest.fn() },
}));

// Builds a mock Firestore DocumentSnapshot
const makeMockDoc = (id: string, data: object) => ({
  id,
  exists: true,
  data: () => ({ ...data, createdAt: { toDate: () => new Date() } }),
});

describe("Appointment Service", () => {
  // Reusable db chain mock: db.collection().where().where().where().get()
  const mockDbQuery = {
    where: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-wire chain after clearAllMocks wipes return values
    mockDbQuery.where.mockReturnValue(mockDbQuery);
    mockDbQuery.get.mockResolvedValue({ empty: true, docs: [] });
    (db.collection as jest.Mock).mockReturnValue(mockDbQuery);
  });


  describe("createAppointment", () => {
    it("should create an appointment successfully", async () => {
      // Arrange
      const mockData = {
        patientId: "patient-001",
        doctorId: "doctor-001",
        date: new Date("2026-04-10"),
        notes: "Annual check-up",
      };
      // Conflict check → no conflict
      mockDbQuery.get.mockResolvedValue({ empty: true });
      (firestoreRepository.createDocument as jest.Mock).mockResolvedValue("appointment-abc123");

      // Act
      const result = await appointmentService.createAppointment(mockData);

      // Assert
      expect(firestoreRepository.createDocument).toHaveBeenCalled();
      expect(result).toHaveProperty("id", "appointment-abc123");
      expect(result).toHaveProperty("patientId", "patient-001");
      expect(result).toHaveProperty("status", "pending");
    });

    it("should throw if doctor is already booked at that time", async () => {
      // Arrange — conflict check returns non-empty snapshot
      const mockData = {
        patientId: "patient-001",
        doctorId: "doctor-001",
        date: new Date("2026-04-10"),
      };
      mockDbQuery.get.mockResolvedValue({ empty: false });

      // Act & Assert
      await expect(appointmentService.createAppointment(mockData)).rejects.toThrow(
        "Doctor already has an appointment at this time"
      );
      expect(firestoreRepository.createDocument).not.toHaveBeenCalled();
    });

    it("should throw if createDocument fails", async () => {
      // Arrange — conflict check passes, but Firestore write fails
      const mockData = {
        patientId: "patient-001",
        doctorId: "doctor-001",
        date: new Date("2026-04-10"),
      };
      mockDbQuery.get.mockResolvedValue({ empty: true });
      (firestoreRepository.createDocument as jest.Mock).mockRejectedValue(
        new Error("Firestore write failed")
      );

      // Act & Assert
      await expect(appointmentService.createAppointment(mockData)).rejects.toThrow(
        "Firestore write failed"
      );
    });
  });


  describe("getAppointmentById", () => {
    it("should return appointment data when found", async () => {
      // Arrange — uses getDocumentById from repository (not db directly)
      const mockId = "appointment-001";
      const mockDoc = makeMockDoc(mockId, {
        patientId: "patient-001",
        doctorId: "doctor-001",
        date: new Date("2026-04-10"),
        status: "pending",
      });
      (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(mockDoc);

      // Act
      const result = await appointmentService.getAppointmentById(mockId);

      // Assert
      expect(firestoreRepository.getDocumentById).toHaveBeenCalledWith(
        expect.any(String),
        mockId
      );
      expect(result).toHaveProperty("id", mockId);
      expect(result).toHaveProperty("patientId", "patient-001");
    });

    it("should throw an error when appointment is not found", async () => {
      // Arrange
      (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        appointmentService.getAppointmentById("nonexistent-id")
      ).rejects.toThrow("not found");
    });
  });

  
  describe("getAllAppointments", () => {
    it("should return all appointments for an admin (uses getDocuments)", async () => {
      // Arrange — admin path calls firestoreRepository.getDocuments
      const mockSnapshot = {
        docs: [
          makeMockDoc("appt-001", { patientId: "patient-001", doctorId: "doctor-001", date: new Date() }),
          makeMockDoc("appt-002", { patientId: "patient-002", doctorId: "doctor-002", date: new Date() }),
        ],
      };
      (firestoreRepository.getDocuments as jest.Mock).mockResolvedValue(mockSnapshot);

      // Act
      const result = await appointmentService.getAllAppointments("admin-user", "admin");

      // Assert
      expect(firestoreRepository.getDocuments).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("id", "appt-001");
    });

    it("should filter by patientId for a patient role (uses db.collection().where().get())", async () => {
      // Arrange — patient path calls db.collection().where("patientId","==",uid).get()
      const uid = "user-456";
      const mockSnapshot = {
        docs: [
          makeMockDoc("appt-001", { patientId: uid, doctorId: "doc-001", date: new Date() }),
        ],
      };
      mockDbQuery.get.mockResolvedValue(mockSnapshot);

      // Act
      const result = await appointmentService.getAllAppointments(uid, "patient");

      // Assert
      expect(db.collection).toHaveBeenCalledWith("appointments");
      expect(mockDbQuery.where).toHaveBeenCalledWith("patientId", "==", uid);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id", "appt-001");
    });

    it("should filter by doctorId for a doctor role (uses db.collection().where().get())", async () => {
      // Arrange — doctor path calls db.collection().where("doctorId","==",uid).get()
      const uid = "doc-uid-123";
      const mockSnapshot = {
        docs: [
          makeMockDoc("appt-001", { patientId: "p-001", doctorId: uid, date: new Date() }),
        ],
      };
      mockDbQuery.get.mockResolvedValue(mockSnapshot);

      // Act
      const result = await appointmentService.getAllAppointments(uid, "doctor");

      // Assert
      expect(mockDbQuery.where).toHaveBeenCalledWith("doctorId", "==", uid);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id", "appt-001");
    });

    it("should throw an error if the admin repository call fails", async () => {
      // Arrange
      (firestoreRepository.getDocuments as jest.Mock).mockRejectedValue(
        new Error("Firestore unavailable")
      );

      // Act & Assert
      await expect(
        appointmentService.getAllAppointments("user-123", "admin")
      ).rejects.toThrow("Firestore unavailable");
    });
  });


  describe("deleteAppointment", () => {
    it("should delete an appointment successfully", async () => {
      // Arrange:
      // Step 1 — getAppointmentById calls getDocumentById
      // Step 2 — deleteAppointment calls getDocuments to find doc ref by d.id === id
      // Step 3 — deleteDocument is called with the Firestore doc ref id
      const mockId = "appt-001";
      const mockDoc = makeMockDoc(mockId, {
        patientId: "p-001",
        doctorId: "doctor-001",
        date: new Date("2026-04-10"),
        status: "pending",
      });

      (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(mockDoc);
      // getDocuments snapshot: doc.id must equal mockId so find() matches
      (firestoreRepository.getDocuments as jest.Mock).mockResolvedValue({
        docs: [mockDoc],
      });
      (firestoreRepository.deleteDocument as jest.Mock).mockResolvedValue(undefined);

      // Act & Assert
      await expect(appointmentService.deleteAppointment(mockId)).resolves.not.toThrow();
      expect(firestoreRepository.deleteDocument).toHaveBeenCalledWith(
        expect.any(String),
        mockId  // doc.id === mockId
      );
    });

    it("should throw an error if appointment does not exist", async () => {
      // Arrange — getDocumentById returns null → getAppointmentById throws
      (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        appointmentService.deleteAppointment("ghost-id")
      ).rejects.toThrow("not found");
    });
  });
});