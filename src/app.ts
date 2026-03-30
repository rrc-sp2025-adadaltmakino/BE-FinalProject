// import the express application and type definition
import express, { Express } from "express";
import morgan from "morgan";

const app: Express = express();

// Interface for health check response - defines the structure of our response object
interface HealthCheckResponse {
  status: string;
  uptime: number;
  timestamp: string;
  version: string;
}

// Middleware for logging HTTP requests
app.use(morgan("combined"));


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

export default app;