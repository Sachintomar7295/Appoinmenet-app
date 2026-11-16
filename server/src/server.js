import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import appointmentsRouter from "./routes/appointments.js";

dotenv.config();
const app = express();
const allowedClientUrl = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({
  origin(origin, callback) {
    const isLocalDevelopmentOrigin = process.env.NODE_ENV !== "production" &&
      /^http:\/\/localhost:\d+$/.test(origin || "");
    callback(null, !origin || origin === allowedClientUrl || isLocalDevelopmentOrigin);
  }
}));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "appointment-api" }));
app.use("/api/appointments", appointmentsRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === "CastError") return res.status(400).json({ message: "Invalid appointment ID." });
  if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
  res.status(500).json({ message: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/appointment_manager";

try {
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI not set; using local default mongodb://127.0.0.1:27017/appointment_manager");
  }
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
  app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
} catch (error) {
  console.error("Server startup failed:", error.message);
  process.exit(1);
}