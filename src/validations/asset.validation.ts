import { z } from "zod";

export const assetSchema = z.object({
  name: z.string().min(2),
  serialNumber: z.string().min(3),
  category: z.string().min(2),
  status: z.enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED"]),
});
