import { z } from "zod";

export const createDeviceRequestSchema = z.object({
  assetId: z.number().int().positive(),
  type: z.enum(["REPLACE_DEVICE", "UPGRADE_HARDWARE", "OTHER"]),
  message: z.string().trim().min(5).max(2000),
});

export const reviewDeviceRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "COMPLETED"]),
  resolutionNote: z.string().trim().min(3).max(1000).optional(),
});
