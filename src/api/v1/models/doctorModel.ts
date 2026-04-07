/**
 * Represents a doctor in the system
 */
export interface Doctor {
  id: string;
  name: string;
  departmentId: string;
  availableDays: string[];
  uid: string;
  createdAt: Date;
  updatedAt: Date;
}