import express, { Express } from "express";
import setupSwagger from "../config/swagger";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import morgan from "morgan";
import doctorRoutes from "./api/v1/routes/doctorRoutes";
import appointmentRoutes from './api/v1/routes/appointmentRoutes';
import userRoutes from './api/v1/routes/userRoutes';
import adminRoutes from './api/v1/routes/adminRoutes';
import { getHelmetConfig } from "../config/helmetConfig";
import getCorsOptions from "../config/corsConfig";

const app: Express = express();

interface HealthCheckResponse {
  status: string;
  uptime: number;
  timestamp: string;
  version: string;
}


app.use(morgan("combined"));

app.use(express.json());

app.use(helmet());

app.use(getHelmetConfig());

app.use(helmet());

app.use(cors());

app.use(cors(getCorsOptions()));


/**
 * Health check endpoint that returns server status information
 * @returns JSON response with server health metrics
 */
app.get("/api/v1/health", (req, res) => {
  const healthData: HealthCheckResponse = {
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  };

  res.json(healthData);
});

// API Routes
app.use("/api/v1/doctors", doctorRoutes);
app.use("/api/v1/appointments", appointmentRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);

setupSwagger(app);

export default app;