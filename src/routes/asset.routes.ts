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

router.get("/", getAssets);
router.get("/:id", getAssetById);

router.post(
  "/",
  roleMiddleware(["ADMIN", "IT_ENGINEER"]),
  validate(assetSchema),
  createAsset
);

router.put(
  "/:id",
  roleMiddleware(["ADMIN", "IT_ENGINEER"]),
  validate(assetSchema),
  updateAsset
);

router.delete(
  "/:id",
  roleMiddleware(["ADMIN", "IT_ENGINEER"]),
  deleteAsset
);

export default router;
