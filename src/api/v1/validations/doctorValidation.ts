import Joi, { ObjectSchema } from 'joi';

// Doctor operation schemas organized by request part
export const doctorSchemas = {
  // POST /doctors - Create new doctor
  create: {
    body: Joi.object({
      name: Joi.string().required().messages({
        'any.required': 'Doctor name is required',
        'string.empty': 'Doctor name cannot be empty',
      }),
      specialization: Joi.string().required().messages({
        'any.required': 'Specialization is required',
        'string.empty': 'Specialization cannot be empty',
      }),
      departmentId: Joi.string().required().messages({
        'any.required': 'Department ID is required',
        'string.empty': 'Department ID cannot be empty',
      }),
      email: Joi.string().email().required().messages({
        'any.required': 'Email is required',
        'string.empty': 'Email cannot be empty',
        'string.email': 'Email must be a valid email address',
      }),
      phone: Joi.string().optional().messages({
        'string.empty': 'Phone cannot be empty',
      }),
      available: Joi.boolean().default(true),
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
      specialization: Joi.string().optional().messages({
        'string.empty': 'Specialization cannot be empty',
      }),
      departmentId: Joi.string().optional().messages({
        'string.empty': 'Department ID cannot be empty',
      }),
      email: Joi.string().email().optional().messages({
        'string.empty': 'Email cannot be empty',
        'string.email': 'Email must be a valid email address',
      }),
      phone: Joi.string().optional().messages({
        'string.empty': 'Phone cannot be empty',
      }),
      available: Joi.boolean().optional(),
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