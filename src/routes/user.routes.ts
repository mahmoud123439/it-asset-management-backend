import { Router } from "express";
import {
  getUsers,
  createUser
} from "../controllers/user.controller";

const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get("/", getUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create user
 *     tags:
 *       - Users
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post("/", createUser);

export default router;
