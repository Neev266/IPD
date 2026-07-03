import express from "express";
import cors from "cors";
import apiRouter from "./routes/index.js";
import { errorMiddleware } from "./middleware/error_middleware.js";

const app = express();

// Standard middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API routing
app.use("/api", apiRouter);

// Global express error boundary
app.use(errorMiddleware);

export default app;
