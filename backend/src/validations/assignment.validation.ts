import { z } from "zod";
import { paginationQuery } from "../utils/query";

export const assignAssetSchema = z.object({
  userId: z.number().int().positive(),
  assetId: z.number().int().positive(),
});

export const returnAssetSchema = z.object({
  assetId: z.number().int().positive(),
});

export const replaceAssignedAssetSchema = z.object({
  requestId: z.number().int().positive(),
  replacementAssetId: z.number().int().positive(),
  originalAssetStatus: z.enum(["AVAILABLE", "MAINTENANCE", "RETIRED"]).default("MAINTENANCE"),
  issuedByName: z.string().trim().min(2).max(120).optional(),
  resolutionNote: z.string().trim().min(3).max(1000).optional(),
});

export const assignmentQuerySchema = z.object({
  ...paginationQuery,
  userId: z.coerce.number().int().positive().optional(),
  assetId: z.coerce.number().int().positive().optional(),
  active: z.enum(["true", "false"]).optional(),
});
