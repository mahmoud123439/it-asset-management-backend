import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import assetRoutes from "./routes/asset.routes";
import assignmentRoutes from "./routes/assignment.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import departmentRoutes from "./routes/department.routes";
import deviceOnboardingRoutes from "./routes/device-onboarding.routes";
import deviceRequestRoutes from "./routes/device-request.routes";

import { swaggerSpec } from "./swagger";
import { authMiddleware } from "./middlewares/auth.middleware";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();
const allowedOrigins = new Set(
  (
    process.env.FRONTEND_ORIGINS ??
    "https://smart-it.local:5174,https://127.0.0.1:5174,http://127.0.0.1:5173"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: "Too many requests, please try again later."
  }
});

app.use(helmet());
app.use(morgan("combined"));
app.use(limiter);
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, !origin || allowedOrigins.has(origin));
    },
  }),
);
app.use(express.json());

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.get("/", (req, res) => {
  res.json({
    message: "IT Asset Management API Running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/onboarding", authMiddleware, deviceOnboardingRoutes);
app.use("/api/device-requests", authMiddleware, deviceRequestRoutes);

app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/departments", authMiddleware, departmentRoutes);
app.use("/api/assets", authMiddleware, assetRoutes);
app.use("/api/assignments", authMiddleware, assignmentRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);

app.use(errorHandler);

export default app;
