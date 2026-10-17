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
 *     summary: Get assignment history with pagination and filters
 *     tags:
 *       - Assignments
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *       - in: query
 *         name: userId
 *         schema: { type: integer }
 *       - in: query
 *         name: assetId
 *         schema: { type: integer }
 *       - in: query
 *         name: active
 *         description: true = not yet returned, false = already returned
 *         schema: { type: string, enum: ["true", "false"] }
 *     responses:
 *       200:
 *         description: Paginated assignments ({ data, meta })
 *       400:
 *         description: Invalid query parameters
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
 *       400:
 *         description: Asset is not available
 *       404:
 *         description: User or asset not found
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
 *       404:
 *         description: Active assignment not found
 */
router.post(
  "/return",
  roleMiddleware(["ADMIN", "IT_ENGINEER"]),
  validate(returnAssetSchema),
  returnAsset
);

export default router;
