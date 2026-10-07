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

router.get(
  "/",
  getAssignments
);

router.post(
  "/",
  roleMiddleware(["ADMIN", "IT_ENGINEER"]),
  validate(assignAssetSchema),
  assignAsset
);

router.post(
  "/return",
  roleMiddleware(["ADMIN", "IT_ENGINEER"]),
  validate(returnAssetSchema),
  returnAsset
);

export default router;
