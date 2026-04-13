import Joi, { ObjectSchema } from 'joi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Doctor operation schemas organized by request part
export const doctorSchemas = {
  // POST /doctors - Create new doctor
  create: {
    body: Joi.object({
      name: Joi.string().required().messages({
        'any.required': 'Doctor name is required',
        'string.empty': 'Doctor name cannot be empty',
      }),
      specialty: Joi.string().required().messages({
        'any.required': 'Specialty is required',
        'string.empty': 'Specialty cannot be empty',
      }),
      availableDays: Joi.array()
        .items(Joi.string().valid(...DAYS))
        .required()
        .messages({
          'any.required': 'Available days are required',
        }),
      uid: Joi.string().required().messages({
        'any.required': 'User ID (uid) is required',
        'string.empty': 'User ID cannot be empty',
      }),
    }),
  },

  // GET /doctors/:id - Get single doctor
  getById: {
    params: Joi.object({
      id: Joi.string().required().messages({
        'any.required': 'Doctor ID is required',
        'string.empty': 'Doctor ID cannot be empty',
      }),
    }),
  },

  // PUT /doctors/:id - Update doctor
  update: {
    params: Joi.object({
      id: Joi.string().required().messages({
        'any.required': 'Doctor ID is required',
        'string.empty': 'Doctor ID cannot be empty',
      }),
    }),
    body: Joi.object({
      name: Joi.string().optional().messages({
        'string.empty': 'Doctor name cannot be empty',
      }),
      specialty: Joi.string().optional().messages({
        'string.empty': 'Specialty cannot be empty',
      }),
      availableDays: Joi.array()
        .items(Joi.string().valid(...DAYS))
        .optional(),
    }),
  },

  // DELETE /doctors/:id - Delete doctor
  delete: {
    params: Joi.object({
      id: Joi.string().required().messages({
        'any.required': 'Doctor ID is required',
        'string.empty': 'Doctor ID cannot be empty',
      }),
    }),
  }
};