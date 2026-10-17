import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller";

import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

import {
  registerSchema,
  loginSchema
} from "../validations/auth.validation";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user (always created as EMPLOYEE)
 *     tags:
 *       - Authentication
 *     security: []
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post(
  "/register",
  validate(registerSchema),
  register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Authentication
 *     security: []
 *     responses:
 *       200:
 *         description: Login successful ({ token })
 */
router.post(
  "/login",
  validate(loginSchema),
  login
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Current user's profile, group memberships, and device assignment history
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authMiddleware, getMe);

export default router;
