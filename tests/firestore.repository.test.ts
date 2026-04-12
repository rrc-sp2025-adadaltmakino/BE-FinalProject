import { db } from "../config/firebaseConfig";
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  deleteDocumentsByFieldValues,
  runTransaction,
} from "../src/api/v1/repositories/firestoreRepository";

jest.mock("../config/firebaseConfig", () => ({
  db: {
    collection: jest.fn(),
    batch: jest.fn(),
    runTransaction: jest.fn(),
  },
}));

const mockDocRef = {
  id: "auto-generated-id",
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
};

const mockQueryRef: any = { where: jest.fn(), get: jest.fn() };
mockQueryRef.where.mockReturnValue(mockQueryRef);

const mockCollectionRef = {
  add: jest.fn(),
  doc: jest.fn(),
  get: jest.fn(),
  where: jest.fn(),
};

const mockBatch = { delete: jest.fn(), commit: jest.fn() };
const mockTransaction = { get: jest.fn(), delete: jest.fn() };

describe("Firestore Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-wire after clearAllMocks wipes return values
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
    mockCollectionRef.where.mockReturnValue(mockQueryRef);
    mockQueryRef.where.mockReturnValue(mockQueryRef);
    (db.collection as jest.Mock).mockReturnValue(mockCollectionRef);
    (db.batch as jest.Mock).mockReturnValue(mockBatch);
  });


  describe("runTransaction", () => {
    it("should execute and return the result of the operations callback", async () => {
      const operations = jest.fn().mockResolvedValue("ok");
      (db.runTransaction as jest.Mock).mockImplementation((fn) => fn(mockTransaction));

      const result = await runTransaction(operations);

      expect(db.runTransaction).toHaveBeenCalledWith(operations);
      expect(result).toBe("ok");
    });

    it("should throw with 'Transaction failed:' prefix on Error", async () => {
      (db.runTransaction as jest.Mock).mockRejectedValue(new Error("DB down"));

      await expect(runTransaction(jest.fn())).rejects.toThrow(
        "Transaction failed: DB down"
      );
    });

    it("should throw 'Unknown error' when a non-Error is thrown", async () => {
      (db.runTransaction as jest.Mock).mockRejectedValue("oops");

      await expect(runTransaction(jest.fn())).rejects.toThrow(
        "Transaction failed: Unknown error"
      );
    });
  });


  describe("createDocument", () => {
    it("should use add() and return auto-generated ID when no custom ID given", async () => {
      mockCollectionRef.add.mockResolvedValue({ id: "auto-456" });

      const result = await createDocument("doctors", { name: "Dr. Smith" });

      expect(db.collection).toHaveBeenCalledWith("doctors");
      expect(mockCollectionRef.add).toHaveBeenCalled();
      expect(result).toBe("auto-456");
    });

    it("should use doc().set() and return custom ID when custom ID is given", async () => {
      mockDocRef.set.mockResolvedValue(undefined);
      mockDocRef.id = "custom-id-789";

      const result = await createDocument(
        "departments",
        { name: "Cardiology" },
        "custom-id-789"
      );

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("custom-id-789");
      expect(mockDocRef.set).toHaveBeenCalledWith({ name: "Cardiology" });
      expect(result).toBe("custom-id-789");
    });

    it("should throw wrapped error with collection name on failure", async () => {
      mockCollectionRef.add.mockRejectedValue(new Error("Quota exceeded"));

      await expect(createDocument("appointments", {})).rejects.toThrow(
        "Failed to create document in appointments: Quota exceeded"
      );
    });
  });

 
  describe("getDocuments", () => {
    it("should return the full QuerySnapshot", async () => {
      const mockSnapshot = { docs: [{ id: "d1" }, { id: "d2" }] };
      mockCollectionRef.get.mockResolvedValue(mockSnapshot);

      const result = await getDocuments("doctors");

      expect(db.collection).toHaveBeenCalledWith("doctors");
      expect(result).toBe(mockSnapshot);
    });

    it("should throw wrapped error with collection name on failure", async () => {
      mockCollectionRef.get.mockRejectedValue(new Error("Permission denied"));

      await expect(getDocuments("doctors")).rejects.toThrow(
        "Failed to fetch documents from doctors: Permission denied"
      );
    });
  });

  
  describe("getDocumentById", () => {
    it("should return DocumentSnapshot when document exists", async () => {
      const mockDoc = {
        exists: true,
        id: "appt-001",
        data: () => ({ patientId: "p-001" }),
      };
      mockDocRef.get.mockResolvedValue(mockDoc);

      const result = await getDocumentById("appointments", "appt-001");

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("appt-001");
      expect(result).toBe(mockDoc);
    });

    it("should return null when document does not exist", async () => {
      mockDocRef.get.mockResolvedValue({ exists: false });

      const result = await getDocumentById("appointments", "ghost-id");

      expect(result).toBeNull();
    });

    it("should throw wrapped error with id and collection on failure", async () => {
      mockDocRef.get.mockRejectedValue(new Error("Timeout"));

      await expect(
        getDocumentById("appointments", "appt-001")
      ).rejects.toThrow(
        "Failed to fetch document appt-001 from appointments: Timeout"
      );
    });
  });

  
  describe("updateDocument", () => {
    it("should call doc().update() with correct data", async () => {
      mockDocRef.update.mockResolvedValue(undefined);

      await updateDocument("appointments", "appt-001", { status: "cancelled" });

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("appt-001");
      expect(mockDocRef.update).toHaveBeenCalledWith({ status: "cancelled" });
    });

    it("should resolve with undefined", async () => {
      mockDocRef.update.mockResolvedValue(undefined);

      const result = await updateDocument("doctors", "doc-001", {
        specialty: "Pediatrics",
      });

      expect(result).toBeUndefined();
    });

    it("should throw wrapped error with id and collection on failure", async () => {
      mockDocRef.update.mockRejectedValue(new Error("Not found"));

      await expect(
        updateDocument("doctors", "doc-999", {})
      ).rejects.toThrow(
        "Failed to update document doc-999 in doctors: Not found"
      );
    });
  });

  
  describe("deleteDocument", () => {
    it("should call docRef.delete() when no transaction provided", async () => {
      mockDocRef.delete.mockResolvedValue(undefined);

      await deleteDocument("appointments", "appt-001");

      expect(mockDocRef.delete).toHaveBeenCalled();
      expect(mockTransaction.delete).not.toHaveBeenCalled();
    });

    it("should call transaction.delete(docRef) when transaction is provided", async () => {
      await deleteDocument("appointments", "appt-001", mockTransaction as any);

      expect(mockTransaction.delete).toHaveBeenCalledWith(mockDocRef);
      expect(mockDocRef.delete).not.toHaveBeenCalled();
    });

    it("should throw wrapped error with id and collection on failure", async () => {
      mockDocRef.delete.mockRejectedValue(new Error("Insufficient permissions"));

      await expect(
        deleteDocument("appointments", "appt-001")
      ).rejects.toThrow(
        "Failed to delete document appt-001 from appointments: Insufficient permissions"
      );
    });
  });

  
  describe("deleteDocumentsByFieldValues", () => {
    const mockDocs = [{ ref: { id: "ref-1" } }, { ref: { id: "ref-2" } }];
    const mockQuerySnapshot = { docs: mockDocs };

    it("should chain .where() for each field-value pair and batch delete without transaction", async () => {
      mockQueryRef.get.mockResolvedValue(mockQuerySnapshot);
      mockBatch.commit.mockResolvedValue(undefined);

      await deleteDocumentsByFieldValues("appointments", [
        { fieldName: "doctorId", fieldValue: "doc-001" },
        { fieldName: "status",   fieldValue: "cancelled" },
      ]);

      expect(mockCollectionRef.where).toHaveBeenCalledWith(
        "doctorId", "==", "doc-001"
      );
      expect(mockQueryRef.where).toHaveBeenCalledWith(
        "status", "==", "cancelled"
      );
      expect(mockBatch.delete).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it("should use transaction.get() and transaction.delete() when transaction is provided", async () => {
      mockTransaction.get.mockResolvedValue(mockQuerySnapshot);

      await deleteDocumentsByFieldValues(
        "appointments",
        [{ fieldName: "patientId", fieldValue: "p-001" }],
        mockTransaction as any
      );

      expect(mockTransaction.get).toHaveBeenCalled();
      expect(mockTransaction.delete).toHaveBeenCalledTimes(2);
      expect(db.batch).not.toHaveBeenCalled();
    });

    it("should throw wrapped error with field info on failure", async () => {
      mockQueryRef.get.mockRejectedValue(new Error("Index missing"));

      await expect(
        deleteDocumentsByFieldValues("appointments", [
          { fieldName: "doctorId", fieldValue: "doc-001" },
        ])
      ).rejects.toThrow(
        "Failed to delete documents from appointments where doctorId == doc-001"
      );
    });
  });
});