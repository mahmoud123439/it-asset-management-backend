import { Router } from "express";
import {
  getAssignments,
  assignAsset,
  returnAsset,
  replaceRequestedAsset
} from "../controllers/assignment.controller";

import { validate } from "../middlewares/validate.middleware";
import { workGroupMiddleware } from "../middlewares/work-group.middleware";

import {
  assignAssetSchema,
  returnAssetSchema,
  replaceAssignedAssetSchema
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
 *     summary: Assign asset to user (IT group only)
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
  workGroupMiddleware("it"),
  validate(assignAssetSchema),
  assignAsset
);

/**
 * @swagger
 * /api/assignments/return:
 *   post:
 *     summary: Return assigned asset (IT group only)
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
  workGroupMiddleware("it"),
  validate(returnAssetSchema),
  returnAsset
);

/**
 * @swagger
 * /api/assignments/replace-requested:
 *   post:
 *     summary: Process an approved device replacement request atomically (IT group only)
 *     tags: [Assignments]
 *     responses:
 *       200:
 *         description: Old assignment closed, replacement assigned, and request completed
 *       409:
 *         description: Request or replacement asset is not in a valid state
 */
router.post(
  "/replace-requested",
  workGroupMiddleware("it"),
  validate(replaceAssignedAssetSchema),
  replaceRequestedAsset
);

export default router;
