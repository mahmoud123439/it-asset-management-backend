import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import assetRoutes from "./routes/asset.routes";
import assignmentRoutes from "./routes/assignment.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { authMiddleware } from "./middlewares/auth.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "IT Asset Management API Running ??",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/assets", authMiddleware, assetRoutes);
app.use("/api/assignments", authMiddleware, assignmentRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
