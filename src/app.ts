// import the express application and type definition
import express, { Express } from "express";

// initialize the express application
const app: Express = express();

// respond to GET request at endpoint "/" with message
app.get("/", (req, res) => {
    res.send("Hello, world!");
});

// export app and server for testing
export default app;