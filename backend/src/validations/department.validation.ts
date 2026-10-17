import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
});
