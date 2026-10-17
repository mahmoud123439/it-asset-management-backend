import { z } from "zod";
import { paginationQuery } from "../utils/query";

const statusEnum = z.enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED"]);

// ASSIGNED can only be reached through POST /api/assignments
export const createAssetSchema = z.object({
  name: z.string().trim().min(2),
  serialNumber: z.string().trim().min(3),
  category: z.string().trim().min(2),
  status: z.enum(["AVAILABLE", "MAINTENANCE", "RETIRED"]).default("AVAILABLE"),
});

export const updateAssetSchema = z.object({
  name: z.string().trim().min(2),
  serialNumber: z.string().trim().min(3),
  category: z.string().trim().min(2),
  status: statusEnum,
});

export const assetQuerySchema = z.object({
  ...paginationQuery,
  search: z.string().trim().min(1).optional(),
  status: statusEnum.optional(),
  category: z.string().trim().min(1).optional(),
  sortBy: z
    .enum(["createdAt", "name", "category", "status"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
