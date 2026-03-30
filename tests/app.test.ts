import request from "supertest";
import { Response } from "supertest";
import app from "../src/app";

describe("GET /api/v1/health", () => {
    it("should return server health status", async () => {

        const response: Response = await request(app).get("/api/v1/health");

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("OK");
        expect(response.body).toHaveProperty("uptime");
        expect(response.body).toHaveProperty("timestamp");
        expect(response.body).toHaveProperty("version");
    });
});
