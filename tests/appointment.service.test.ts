import * as appointmentService from '../src/api/v1/services/appointmentServices';
import * as firestoreRepository from '../src/api/v1/repositories/firestoreRepository';

jest.mock('../src/api/v1/repositories/firestoreRepository');

describe('Appointment Service', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('createAppointment', () => {
    it('should create an appointment successfully', async () => {
      // Arrange
      const mockData = {
        patientId: 'patient-001',
        doctorId: 'doctor-001',
        date: new Date('2026-04-10'), 
        notes: 'Annual check-up',
      };
      const mockDocumentId = 'appointment-abc123';
      (firestoreRepository.createDocument as jest.Mock).mockResolvedValue(mockDocumentId);

      // Act
      const result = await appointmentService.createAppointment(mockData);

      // Assert
      expect(firestoreRepository.createDocument).toHaveBeenCalled();
      expect(result).toHaveProperty('id', mockDocumentId);
      expect(result).toHaveProperty('patientId', 'patient-001');
    });

    it('should throw an error if repository fails', async () => {
      const mockData = {
        patientId: 'patient-001',
        doctorId: 'doctor-001',
        date: new Date('2026-04-10'),
        notes: 'Annual check-up',
      };
      (firestoreRepository.createDocument as jest.Mock).mockRejectedValue(
        new Error('Firestore write failed')
      );

      await expect(appointmentService.createAppointment(mockData)).rejects.toThrow(
        'Firestore write failed'
      );
    });
  });

  describe('getAppointmentById', () => {
    it('should return appointment data when found', async () => {
      // Arrange
      const mockId = 'appointment-001';
      const mockDoc = {
        id: mockId, exists: true,
        data: () => ({
          patientId: 'patient-001', 
          doctorId: 'doctor-001', 
          departmentId: 'dept-001',
          date: '2026-04-10', 
          time: '10:00', 
          reason: 'Annual check-up', 
          status: 'confirmed',
          createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() },
        }),
      };
      (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(mockDoc);

      // Act
      const result = await appointmentService.getAppointmentById(mockId);

      // Assert
      expect(firestoreRepository.getDocumentById).toHaveBeenCalledWith(expect.any(String), mockId);
      expect(result).toHaveProperty('id', mockId);
      expect(result).toHaveProperty('patientId', 'patient-001');
    });

    it('should throw an error when appointment is not found', async () => {
      (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(null);

      await expect(
        appointmentService.getAppointmentById('nonexistent-id')
      ).rejects.toThrow('not found');
    });
  });

  describe('getAllAppointments', () => {
    it('should return all appointments', async () => {
      const mockSnapshot = {
        docs: [{
          id: 'appt-001',
          data: () => ({
            patientId: 'patient-001', 
            doctorId: 'doctor-001', 
            departmentId: 'dept-001',
            date: '2026-04-10', 
            time: '09:00', 
            reason: 'Check-up', 
            status: 'confirmed',
            createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() },
          }),
        }],
      };
      (firestoreRepository.getDocuments as jest.Mock).mockResolvedValue(mockSnapshot);

      const result = await appointmentService.getAllAppointments('user-123', 'admin');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'appt-001');
    });
  });

  describe('deleteAppointment', () => {
    it('should delete an appointment successfully', async () => {
      const mockId = 'appt-001';
      const mockDoc = { exists: true, data: () => ({ patientId: 'p-001' }) };
      (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(mockDoc);
      (firestoreRepository.deleteDocument as jest.Mock).mockResolvedValue(undefined);

      await expect(appointmentService.deleteAppointment(mockId)).resolves.not.toThrow();
      expect(firestoreRepository.deleteDocument).toHaveBeenCalledWith(expect.any(String), mockId);
    });

    it('should throw error if appointment does not exist', async () => {
      (firestoreRepository.getDocumentById as jest.Mock).mockResolvedValue(null);

      await expect(
        appointmentService.deleteAppointment('ghost-id')
      ).rejects.toThrow('not found');
    });
  });
});