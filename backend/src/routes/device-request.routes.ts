import { Router } from "express";
import {
  createDeviceRequest,
  getDeviceRequests,
  reviewDeviceRequest,
} from "../controllers/device-request.controller";
import { validate } from "../middlewares/validate.middleware";
import { workGroupMiddleware } from "../middlewares/work-group.middleware";
import {
  createDeviceRequestSchema,
  reviewDeviceRequestSchema,
} from "../validations/device-request.validation";

const router = Router();

/**
 * @swagger
 * /api/device-requests:
 *   get:
 *     summary: List requests owned by the current user, or all requests for IT-group members
 *     tags: [Device Requests]
 *     parameters:
 *       - in: query
 *         name: scope
 *         schema: { type: string, enum: [mine] }
 *         description: Restrict IT members to their own requests
 *   post:
 *     summary: Request a replacement device or hardware upgrade for an assigned device
 *     tags: [Device Requests]
 *     responses:
 *       201:
 *         description: Request created
 *       403:
 *         description: Device is not actively assigned to the current user
 */
router.get("/", getDeviceRequests);
router.post("/", validate(createDeviceRequestSchema), createDeviceRequest);

/**
 * @swagger
 * /api/device-requests/{id}:
 *   patch:
 *     summary: Approve, reject, or complete a device request (IT group only)
 *     tags: [Device Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
router.patch(
  "/:id",
  workGroupMiddleware("it"),
  validate(reviewDeviceRequestSchema),
  reviewDeviceRequest,
);

export default router;
