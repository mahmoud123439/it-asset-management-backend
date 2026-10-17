import { Router } from "express";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from "../controllers/department.controller";

import { validate } from "../middlewares/validate.middleware";
import { workGroupMiddleware } from "../middlewares/work-group.middleware";
import { departmentSchema } from "../validations/department.validation";

const router = Router();

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: List all departments (IT group only; includes _count.users)
 *     tags:
 *       - Departments
 *     responses:
 *       200:
 *         description: Departments retrieved successfully
 */
router.get("/", workGroupMiddleware("it"), getDepartments);

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: Create department (IT group only)
 *     tags:
 *       - Departments
 *     responses:
 *       201:
 *         description: Department created successfully
 *       409:
 *         description: Department name already exists
 */
router.post(
  "/",
  workGroupMiddleware("it"),
  validate(departmentSchema),
  createDepartment
);

/**
 * @swagger
 * /api/departments/{id}:
 *   put:
 *     summary: Rename department (IT group only)
 *     tags:
 *       - Departments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       404:
 *         description: Department not found
 *       409:
 *         description: Department name already exists
 */
router.put(
  "/:id",
  workGroupMiddleware("it"),
  validate(departmentSchema),
  updateDepartment
);

/**
 * @swagger
 * /api/departments/{id}:
 *   delete:
 *     summary: Delete department (IT group only, blocked while it has users)
 *     tags:
 *       - Departments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Department deleted successfully
 *       404:
 *         description: Department not found
 *       409:
 *         description: Department still has users
 */
router.delete(
  "/:id",
  workGroupMiddleware("it"),
  deleteDepartment
);

export default router;
