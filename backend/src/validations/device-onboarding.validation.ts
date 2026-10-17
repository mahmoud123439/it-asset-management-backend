import { z } from "zod";
import { createAssetSchema } from "./asset.validation";

export const onboardDeviceSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  employeeName: z.string().trim().min(2).max(120),
  jobTitle: z.string().trim().min(2).max(120),
  issuedByName: z.string().trim().min(2).max(120),
  asset: createAssetSchema.extend({
    windowsEdition: z.string().trim().min(1),
    antivirusProduct: z.string().trim().min(1),
    windowsLicenseAssigned: z.boolean(),
  }),
});
