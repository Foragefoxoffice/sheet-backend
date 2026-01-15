import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import approvalRoutes from "./routes/approvals.js";
import reportRoutes from "./routes/reports.js";
import departmentRoutes from "./routes/departments.js";
import userRoutes from "./routes/users.js";
import roleRoutes from "./routes/roles.js";

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: [
      "https://sheet-frontend-lemon.vercel.app",
      "https://sheet-backend-orpin.vercel.app",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Task Management API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);

app.use(notFound);
app.use(errorHandler);

export default app; // ✅ REQUIRED FOR VERCEL
