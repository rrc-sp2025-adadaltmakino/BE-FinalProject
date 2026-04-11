import Joi, { ObjectSchema } from 'joi';


export const appointmentSchemas = {

  // POST /appointments - Create new appointment
  create: {
    body: Joi.object({
      doctorId: Joi.string().required().messages({
        'any.required': 'Doctor ID is required',
        'string.empty': 'Doctor ID cannot be empty',
      }),
      departmentId: Joi.string().required().messages({
        'any.required': 'Department ID is required',
        'string.empty': 'Department ID cannot be empty',
      }),
      date: Joi.string()
        .isoDate()
        .required()
        .messages({
          'any.required': 'Appointment date is required',
          'string.empty': 'Appointment date cannot be empty',
          'string.isoDate': 'Date must be a valid ISO date (e.g. 2025-06-15)',
        }),
      time: Joi.string()
        .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
        .required()
        .messages({
          'any.required': 'Appointment time is required',
          'string.empty': 'Appointment time cannot be empty',
          'string.pattern.base': 'Time must be in HH:MM format (e.g. 09:30)',
        }),
      notes: Joi.string().optional().messages({
        'string.empty': 'Notes cannot be empty',
      }),
    }),
  },

  // GET /appointments/:id - Get single appointment
  getById: {
    params: Joi.object({
      id: Joi.string().required().messages({
        'any.required': 'Appointment ID is required',
        'string.empty': 'Appointment ID cannot be empty',
      }),
    }),
  },

  // PUT /appointments/:id - Update appointment
  update: {
    params: Joi.object({
      id: Joi.string().required().messages({
        'any.required': 'Appointment ID is required',
        'string.empty': 'Appointment ID cannot be empty',
      }),
    }),
    body: Joi.object({
      date: Joi.string().isoDate().optional().messages({
        'string.empty': 'Appointment date cannot be empty',
        'string.isoDate': 'Date must be a valid ISO date (e.g. 2025-06-15)',
      }),
      time: Joi.string()
        .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
        .optional()
        .messages({
          'string.empty': 'Appointment time cannot be empty',
          'string.pattern.base': 'Time must be in HH:MM format (e.g. 09:30)',
        }),
      status: Joi.string()
        .valid('pending', 'confirmed', 'cancelled')
        .optional()
        .messages({
          'any.only': 'Status must be one of: pending, confirmed, cancelled',
        }),
      notes: Joi.string().optional().messages({
        'string.empty': 'Notes cannot be empty',
      }),
    }),
  },

  // DELETE /appointments/:id - Delete appointment
  delete: {
    params: Joi.object({
      id: Joi.string().required().messages({
        'any.required': 'Appointment ID is required',
        'string.empty': 'Appointment ID cannot be empty',
      }),
    }),
  }
};