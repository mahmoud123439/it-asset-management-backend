import { onboardDeviceSchema } from "../src/validations/device-onboarding.validation";

describe("Device handover details validation", () => {
  const validOnboarding = {
    email: "employee@example.com",
    password: "Password123",
    employeeName: "Employee Name",
    jobTitle: "Operations Specialist",
    issuedByName: "IT Specialist",
    asset: {
      name: "Employee laptop",
      serialNumber: "LAPTOP-001",
      category: "Laptop",
      windowsEdition: "Windows 11 Pro",
      windowsLicenseAssigned: true,
      antivirusProduct: "Kaspersky",
      softwareLicenses: ["Microsoft 365", "Adobe"],
    },
  };

  test("accepts employee identity, device, and license details", () => {
    const result = onboardDeviceSchema.safeParse(validOnboarding);

    expect(result.success).toBe(true);
  });

  test.each(["employeeName", "jobTitle", "issuedByName"] as const)(
    "requires %s for the handover form",
    (field) => {
      const result = onboardDeviceSchema.safeParse({
        ...validOnboarding,
        [field]: "",
      });

      expect(result.success).toBe(false);
    },
  );
});
