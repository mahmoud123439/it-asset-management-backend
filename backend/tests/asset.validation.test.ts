import {
  createAssetSchema,
  updateAssetSchema,
} from "../src/validations/asset.validation";

describe("Asset software license validation", () => {
  const validAsset = {
    name: "Employee laptop",
    serialNumber: "LAPTOP-001",
    category: "Laptop",
  };

  test("defaults the software license list to empty", () => {
    const result = createAssetSchema.parse(validAsset);

    expect(result.softwareLicenses).toEqual([]);
  });

  test("accepts built-in and custom software license names", () => {
    const softwareLicenses = ["Microsoft 365", "Kaspersky", "Adobe", "AutoCAD"];
    const result = createAssetSchema.parse({ ...validAsset, softwareLicenses });

    expect(result.softwareLicenses).toEqual(softwareLicenses);
  });

  test("rejects duplicate software license names ignoring case", () => {
    const result = createAssetSchema.safeParse({
      ...validAsset,
      softwareLicenses: ["Adobe", " adobe "],
    });

    expect(result.success).toBe(false);
  });

  test("accepts RAM and storage capacity/type specifications", () => {
    const result = createAssetSchema.parse({
      ...validAsset,
      memoryGb: 16,
      storageGb: 512,
      storageType: "NVMe SSD",
    });

    expect(result).toMatchObject({
      memoryGb: 16,
      storageGb: 512,
      storageType: "NVMe SSD",
    });
  });

  test("rejects invalid storage specifications", () => {
    const result = createAssetSchema.safeParse({
      ...validAsset,
      storageGb: 0,
    });

    expect(result.success).toBe(false);
  });

  test("allows IT to clear existing optional specifications", () => {
    const result = updateAssetSchema.safeParse({
      ...validAsset,
      status: "ASSIGNED",
      memoryGb: null,
      storageGb: null,
      storageType: null,
      processor: null,
    });

    expect(result.success).toBe(true);
  });
});
