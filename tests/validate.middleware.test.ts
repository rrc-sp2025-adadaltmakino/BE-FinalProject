import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../src/api/v1/middleware/validate';
import Joi from 'joi';

describe('validateRequest Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { body: {}, params: {}, query: {} };
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn(), locals: {} };
    mockNext = jest.fn();
  });

  it('should pass for valid body input', () => {
    const testSchemas = {
      body: Joi.object({
        patientName: Joi.string().required(),
        age: Joi.number().integer().min(0).max(150),
      }),
    };
    mockReq.body = { patientName: 'John Doe', age: 30 };
    const middleware = validateRequest(testSchemas);

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should fail for invalid body input', () => {
    const testSchemas = {
      body: Joi.object({
        patientName: Joi.string().required(),
        age: Joi.number().integer().min(0).max(150),
      }),
    };
    mockReq.body = { patientName: 'John Doe', age: 9999 }; // out of range
    const middleware = validateRequest(testSchemas);

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: expect.stringContaining('Validation error'),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should validate params correctly', () => {
    const testSchemas = { params: Joi.object({ id: Joi.string().required() }) };
    mockReq.params = { id: 'appointment-123' };
    const middleware = validateRequest(testSchemas);

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should fail when required params are missing', () => {
    const testSchemas = { params: Joi.object({ id: Joi.string().required() }) };
    mockReq.params = {};
    const middleware = validateRequest(testSchemas);

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: expect.stringContaining('Params'),
    });
  });

  it('should validate multiple request parts together', () => {
    const testSchemas = {
      params: Joi.object({ id: Joi.string().required() }),
      body: Joi.object({ doctorId: Joi.string().required() }),
      query: Joi.object({ date: Joi.string().optional() }),
    };
    mockReq.params = { id: 'appt-001' };
    mockReq.body = { doctorId: 'doc-123' };
    mockReq.query = { date: '2026-04-10' };
    const middleware = validateRequest(testSchemas);

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should fail when required body field is missing', () => {
    const testSchemas = {
      body: Joi.object({
        doctorId: Joi.string().required(),
        patientId: Joi.string().required(),
      }),
    };
    mockReq.body = { doctorId: 'doc-123' }; // missing patientId
    const middleware = validateRequest(testSchemas);

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: expect.stringContaining('Body'),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
