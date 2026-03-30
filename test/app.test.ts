import request from "supertest";
// import supertest request object

import { Response } from "supertest";
// import supertest Response type

import app from "../src/app";
// import express application and server

describe("GET /", () => {
    it("should return Hello, world!", async () => {
        // create GET request to root endpoint
        const response: Response = await request(app).get("/");

        // assert that response status is OK, response text is "Hello, world!"
        expect(response.status).toBe(200);
        expect(response.text).toBe("Hello, world!");
    });
});