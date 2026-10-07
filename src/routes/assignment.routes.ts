import { Router } from "express";
import {
  assignAsset,
  returnAsset
} from "../controllers/assignment.controller";

const router = Router();

router.post("/", assignAsset);
router.post("/return", returnAsset);

export default router;



