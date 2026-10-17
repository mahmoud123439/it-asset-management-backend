import { Router } from "express";
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  updateWindowsLicense,
  deleteAsset
} from "../controllers/asset.controller";

import { validate } from "../middlewares/validate.middleware";
import { workGroupMiddleware } from "../middlewares/work-group.middleware";
import {
  createAssetSchema,
  updateAssetSchema,
  windowsLicenseSchema
} from "../validations/asset.validation";

const router = Router();

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: List assets with pagination, search and filters
 *     tags:
 *       - Assets
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *       - in: query
 *         name: search
 *         description: Case-insensitive match on name or serialNumber
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [AVAILABLE, ASSIGNED, MAINTENANCE, RETIRED] }
 *       - in: query
 *         name: category
 *         description: Case-insensitive exact match
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, name, category, status], default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated assets ({ data, meta })
 *       400:
 *         description: Invalid query parameters
 */
router.get("/", getAssets);

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: Get asset by ID
 *     tags:
 *       - Assets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Asset retrieved successfully
 *       404:
 *         description: Asset not found
 */
router.get("/:id", getAssetById);

/**
 * @swagger
 * /api/assets:
 *   post:
 *     summary: Create new asset (IT group only); softwareLicenses accepts a list of licensed software names
 *     tags:
 *       - Assets
 *     responses:
 *       201:
 *         description: Asset created successfully
 *       409:
 *         description: Serial number already exists
 */
router.post("/", workGroupMiddleware("it"), validate(createAssetSchema), createAsset);

/**
 * @swagger
 * /api/assets/{id}:
 *   put:
 *     summary: Update asset details including RAM and storage specifications (IT group only). ASSIGNED status is managed only through assignments
 *     tags:
 *       - Assets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Asset updated successfully
 *       400:
 *         description: Invalid status transition
 *       404:
 *         description: Asset not found
 *       409:
 *         description: Serial number already exists
 */
router.put(
  "/:id",
  workGroupMiddleware("it"),
  validate(updateAssetSchema),
  updateAsset
);

/**
 * @swagger
 * /api/assets/{id}/licenses/windows:
 *   patch:
 *     summary: Assign or remove a Windows license (IT group only)
 *     tags:
 *       - Assets
 *     responses:
 *       200:
 *         description: Windows license assignment updated
 *       404:
 *         description: Asset not found
 */
router.patch(
  "/:id/licenses/windows",
  workGroupMiddleware("it"),
  validate(windowsLicenseSchema),
  updateWindowsLicense,
);

/**
 * @swagger
 * /api/assets/{id}:
 *   delete:
 *     summary: Delete asset (IT group only). Blocked while assigned or when it has assignment history
 *     tags:
 *       - Assets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Asset deleted successfully
 *       404:
 *         description: Asset not found
 *       409:
 *         description: Asset is assigned or has history
 */
router.delete(
  "/:id",
  workGroupMiddleware("it"),
  deleteAsset
);

export default router;
