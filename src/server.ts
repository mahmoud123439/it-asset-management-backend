import "dotenv/config";
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

import { swaggerSpec } from "./swagger";
import { authMiddleware } from "./middlewares/auth.middleware";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

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
app.use(cors());
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

app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/assets", authMiddleware, assetRoutes);
app.use("/api/assignments", authMiddleware, assignmentRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
