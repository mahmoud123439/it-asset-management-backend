import { Router } from "express";
import { getStats } from "../controllers/dashboard.controller";

const router = Router();

router.get("/stats", getStats);

export default router;
