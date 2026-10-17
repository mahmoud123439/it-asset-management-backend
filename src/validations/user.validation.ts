import { z } from "zod";
import { paginationQuery } from "../utils/query";

const roleEnum = z.enum(["ADMIN", "IT_ENGINEER", "IT_SUPPORT", "EMPLOYEE"]);

export const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  role: roleEnum.default("EMPLOYEE"),
  departmentId: z.number().int().positive().nullable().optional(),
});

export const userQuerySchema = z.object({
  ...paginationQuery,
  search: z.string().trim().min(1).optional(),
  role: roleEnum.optional(),
  departmentId: z.coerce.number().int().positive().optional(),
});
