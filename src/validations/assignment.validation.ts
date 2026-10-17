import { z } from "zod";
import { paginationQuery } from "../utils/query";

export const assignAssetSchema = z.object({
  userId: z.number().int().positive(),
  assetId: z.number().int().positive(),
});

export const returnAssetSchema = z.object({
  assetId: z.number().int().positive(),
});

export const assignmentQuerySchema = z.object({
  ...paginationQuery,
  userId: z.coerce.number().int().positive().optional(),
  assetId: z.coerce.number().int().positive().optional(),
  active: z.enum(["true", "false"]).optional(),
});
