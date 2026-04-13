/**
 * Represents an appointment in the system
 */
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: Date;
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}