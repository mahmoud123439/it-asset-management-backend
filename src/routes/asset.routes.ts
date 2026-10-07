import { Router } from "express";
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset
} from "../controllers/asset.controller";

import { validate } from "../middlewares/validate.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { assetSchema } from "../validations/asset.validation";

const router = Router();

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: Get all assets
 *     tags:
 *       - Assets
 *     responses:
 *       200:
 *         description: Assets retrieved successfully
 */
router.get("/", getAssets);

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: Get asset by ID
 *     tags:
 *       - Assets
 *     responses:
 *       200:
 *         description: Asset retrieved successfully
 */
router.get("/:id", getAssetById);

/**
 * @swagger
 * /api/assets:
 *   post:
 *     summary: Create new asset
 *     tags:
 *       - Assets
 *     responses:
 *       201:
 *         description: Asset created successfully
 */
router.post(
  "/",
  roleMiddleware(["ADMIN", "IT_ENGINEER"]),
  validate(assetSchema),
  createAsset
);

/**
 * @swagger
 * /api/assets/{id}:
 *   put:
 *     summary: Update asset
 *     tags:
 *       - Assets
 *     responses:
 *       200:
 *         description: Asset updated successfully
 */
router.put(
  "/:id",
  roleMiddleware(["ADMIN", "IT_ENGINEER"]),
  validate(assetSchema),
  updateAsset
);

/**
 * @swagger
 * /api/assets/{id}:
 *   delete:
 *     summary: Delete asset
 *     tags:
 *       - Assets
 *     responses:
 *       200:
 *         description: Asset deleted successfully
 */
router.delete(
  "/:id",
  roleMiddleware(["ADMIN", "IT_ENGINEER"]),
  deleteAsset
);

export default router;
