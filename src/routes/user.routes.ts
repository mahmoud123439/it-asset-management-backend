import { Router } from "express";
import { getUsers, createUser } from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { createUserSchema } from "../validations/user.validation";

const router = Router();

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
 *         schema: { type: string, enum: [ADMIN, IT_ENGINEER, IT_SUPPORT, EMPLOYEE] }
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
  roleMiddleware(["ADMIN", "IT_ENGINEER", "IT_SUPPORT"]),
  getUsers
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create user (ADMIN only)
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
 *               role: { type: string, enum: [ADMIN, IT_ENGINEER, IT_SUPPORT, EMPLOYEE], default: EMPLOYEE }
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
  roleMiddleware(["ADMIN"]),
  validate(createUserSchema),
  createUser
);

export default router;
