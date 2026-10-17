import { Router } from "express";
import {
  getUsers,
  createUser,
  getWorkGroups,
  updateMicrosoft365License,
} from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { workGroupMiddleware } from "../middlewares/work-group.middleware";
import {
  createUserSchema,
  microsoft365LicenseSchema,
} from "../validations/user.validation";

const router = Router();

router.get(
  "/groups",
  workGroupMiddleware("it"),
  getWorkGroups,
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List users (ADMIN, IT_ENGINEER, IT_SUPPORT)
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *       - in: query
 *         name: search
 *         description: Case-insensitive match on email
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [ADMIN, IT_ENGINEER, IT_SUPPORT, MANAGER, EMPLOYEE] }
 *       - in: query
 *         name: departmentId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated users ({ data, meta })
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  workGroupMiddleware("it"),
  getUsers
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create user (IT group only)
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [ADMIN, IT_ENGINEER, IT_SUPPORT, MANAGER, EMPLOYEE], default: EMPLOYEE }
 *               departmentId: { type: integer, nullable: true }
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation failed or department not found
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Email already exists
 */
router.post(
  "/",
  workGroupMiddleware("it"),
  validate(createUserSchema),
  createUser
);

/**
 * @swagger
 * /api/users/{id}/licenses/microsoft-365:
 *   patch:
 *     summary: Assign or remove a Microsoft 365 license (IT group only)
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: License assignment updated
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id/licenses/microsoft-365",
  workGroupMiddleware("it"),
  validate(microsoft365LicenseSchema),
  updateMicrosoft365License,
);

export default router;
