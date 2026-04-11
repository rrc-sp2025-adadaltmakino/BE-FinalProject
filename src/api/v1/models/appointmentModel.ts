/**
 * Represents an appointment in the system
 */
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}