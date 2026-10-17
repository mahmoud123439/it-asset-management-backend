import { z } from "zod";
import { paginationQuery } from "../utils/query";

const statusEnum = z.enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED"]);
const softwareLicensesSchema = z
  .array(z.string().trim().min(1).max(80))
  .max(20)
  .refine(
    (licenses) =>
      new Set(licenses.map((license) => license.toLocaleLowerCase())).size ===
      licenses.length,
    "Software licenses must not contain duplicates",
  );

// ASSIGNED can only be reached through POST /api/assignments
export const createAssetSchema = z.object({
  name: z.string().trim().min(2),
  serialNumber: z.string().trim().min(3),
  category: z.string().trim().min(2),
  status: z.enum(["AVAILABLE", "MAINTENANCE", "RETIRED"]).default("AVAILABLE"),
  manufacturer: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1).optional(),
  processor: z.string().trim().min(1).optional(),
  memoryGb: z.number().positive().optional(),
  storageGb: z.number().int().positive().optional(),
  storageType: z.string().trim().min(1).max(40).optional(),
  operatingSystem: z.string().trim().min(1).optional(),
  windowsEdition: z.string().trim().min(1).optional(),
  windowsLicenseAssigned: z.boolean().optional(),
  antivirusProduct: z.string().trim().min(1).optional(),
  softwareLicenses: softwareLicensesSchema.default([]),
});

export const updateAssetSchema = z.object({
  name: z.string().trim().min(2),
  serialNumber: z.string().trim().min(3),
  category: z.string().trim().min(2),
  status: statusEnum,
  manufacturer: z.string().trim().min(1).nullable().optional(),
  model: z.string().trim().min(1).nullable().optional(),
  processor: z.string().trim().min(1).nullable().optional(),
  memoryGb: z.number().positive().nullable().optional(),
  storageGb: z.number().int().positive().nullable().optional(),
  storageType: z.string().trim().min(1).max(40).nullable().optional(),
  operatingSystem: z.string().trim().min(1).nullable().optional(),
  windowsEdition: z.string().trim().min(1).nullable().optional(),
  windowsLicenseAssigned: z.boolean().optional(),
  antivirusProduct: z.string().trim().min(1).nullable().optional(),
  softwareLicenses: softwareLicensesSchema.optional(),
});

export const windowsLicenseSchema = z.object({
  assigned: z.boolean(),
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
