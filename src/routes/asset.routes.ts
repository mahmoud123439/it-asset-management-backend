import { Router } from "express";
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset
} from "../controllers/asset.controller";

const router = Router();

router.get("/", getAssets);
router.get("/:id", getAssetById);
router.post("/", createAsset);
router.put("/:id", updateAsset);
router.delete("/:id", deleteAsset);

export default router;
