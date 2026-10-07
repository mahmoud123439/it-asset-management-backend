import { z } from "zod";

export const assignAssetSchema = z.object({
  userId: z.number().int().positive(),
  assetId: z.number().int().positive()
});

export const returnAssetSchema = z.object({
  assetId: z.number().int().positive()
});



