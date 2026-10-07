import { Router } from "express";
import {
  getAssignments,
  assignAsset,
  returnAsset
} from "../controllers/assignment.controller";

import { validate } from "../middlewares/validate.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

import {
  assignAssetSchema,
  returnAssetSchema
} from "../validations/assignment.validation";

const router = Router();

/**
 * @swagger
 * /api/assignments:
 *   get:
 *     summary: Get assignment history
 *     tags:
 *       - Assignments
 *     responses:
 *       200:
 *         description: Assignment history retrieved successfully
 */
router.get("/", getAssignments);

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Assign asset to user
 *     tags:
 *       - Assignments
 *     responses:
 *       201:
 *         description: Asset assigned successfully
 */
router.post(
  "/",
  roleMiddleware(["ADMIN", "IT_ENGINEER"]),
  validate(assignAssetSchema),
  assignAsset
);

/**
 * @swagger
 * /api/assignments/return:
 *   post:
 *     summary: Return assigned asset
 *     tags:
 *       - Assignments
 *     responses:
 *       200:
 *         description: Asset returned successfully
 */
router.post(
  "/return",
  roleMiddleware(["ADMIN", "IT_ENGINEER"]),
  validate(returnAssetSchema),
  returnAsset
);

export default router;
