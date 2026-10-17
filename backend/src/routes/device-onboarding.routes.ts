import { Router } from "express";
import { onboardDevice } from "../controllers/device-onboarding.controller";
import { validate } from "../middlewares/validate.middleware";
import { workGroupMiddleware } from "../middlewares/work-group.middleware";
import { onboardDeviceSchema } from "../validations/device-onboarding.validation";

const router = Router();

router.post(
  "/device",
  workGroupMiddleware("it"),
  validate(onboardDeviceSchema),
  onboardDevice,
);

export default router;
