import swaggerJsdoc from "swagger-jsdoc";
import dotenv from "dotenv";

dotenv.config();

const serverUrl = process.env.SWAGGER_SERVER_URL || "http://localhost:3000/api/v1";

const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Clinic Appointment Booking API",
            version: "1.0.0",
            description: "RESTful API for managing clinic appointments and doctors.",
        },
        servers: [
            {
                url: serverUrl,
                description: process.env.NODE_ENV === "production" ? "Production server" : "Local server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                Appointment: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "appt-001" },
                        patientId: { type: "string", example: "user-001" },
                        doctorId: { type: "string", example: "doc-001" },
                        date: { type: "string", format: "date", example: "2026-05-01" },
                        time: { type: "string", example: "09:30" },
                        status: {
                            type: "string",
                            enum: ["pending", "confirmed", "cancelled"],
                            example: "pending",
                        },
                        notes: { type: "string", example: "Regular checkup" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                Doctor: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "doc-001" },
                        name: { type: "string", example: "Dr. Smith" },
                        specialty: { type: "string", example: "Cardiology" },
                        availableDays: {
                            type: "array",
                            items: { type: "string" },
                            example: ["Monday", "Wednesday"],
                        },
                        uid: { type: "string", example: "firebase-uid-001" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                SuccessResponse: {
                    type: "object",
                    properties: {
                        status: { type: "string", example: "success" },
                        data: { type: "object" },
                        message: { type: "string", example: "Operation successful" },
                    },
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        error: {
                            type: "object",
                            properties: {
                                message: { type: "string", example: "Unauthorized" },
                                code: { type: "string", example: "TOKEN_NOT_FOUND" },
                            },
                        },
                        timestamp: { type: "string", format: "date-time" },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: [
        "./src/api/v1/routes/*.ts",
        "./src/api/v1/controllers/*.ts",
        "./src/api/v1/validations/*.ts",
    ],
};

export const generateSwaggerSpec = (): object => {
    return swaggerJsdoc(swaggerOptions);
};