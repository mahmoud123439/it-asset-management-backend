import { Router } from "express";
import { getStats } from "../controllers/dashboard.controller";

const router = Router();

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get("/stats", getStats);

export default router;
