import { Router } from "express";
import { register, login } from "../controllers/auth.controller";

import { validate } from "../middlewares/validate.middleware";

import {
  registerSchema,
  loginSchema
} from "../validations/auth.validation";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
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
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post(
  "/login",
  validate(loginSchema),
  login
);

export default router;
