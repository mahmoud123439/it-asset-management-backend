import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/prisma";

describe("Device onboarding handover response", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const itEmail = `handover-it-${suffix}@test.invalid`;
  const employeeEmail = `handover-employee-${suffix}@test.invalid`;
  const serialNumber = `HANDOVER-${suffix}`;
  const password = "Temporary-Test-Only-123";
  let itUserId: number;
  let token: string;

  beforeAll(async () => {
    const itGroup = await prisma.workGroup.findUniqueOrThrow({
      where: { slug: "it" },
      select: { id: true },
    });
    const itUser = await prisma.user.create({
      data: {
        email: itEmail,
        password: await bcrypt.hash(password, 10),
        role: "IT_ENGINEER",
        workGroups: { create: { groupId: itGroup.id } },
      },
      select: { id: true },
    });

    itUserId = itUser.id;
    token = jwt.sign({ userId: itUser.id, role: "IT_ENGINEER" }, process.env.JWT_SECRET!);
  });

  afterAll(async () => {
    await prisma.$transaction(async (tx) => {
      const employee = await tx.user.findUnique({
        where: { email: employeeEmail },
        select: { id: true },
      });
      const asset = await tx.asset.findUnique({
        where: { serialNumber },
        select: { id: true },
      });

      if (employee && asset) {
        await tx.assetAssignment.deleteMany({
          where: { userId: employee.id, assetId: asset.id },
        });
      }
      if (asset) await tx.asset.delete({ where: { id: asset.id } });
      if (employee) await tx.user.delete({ where: { id: employee.id } });
      await tx.user.deleteMany({ where: { id: itUserId } });
    });
  });

  test("creates the employee, records the IT issuer, and returns printable form data", async () => {
    const response = await request(app)
      .post("/api/onboarding/device")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: employeeEmail,
        password,
        employeeName: "Handover Test Employee",
        jobTitle: "Operations Specialist",
        issuedByName: "Test IT Specialist",
        asset: {
          name: "Handover test laptop",
          serialNumber,
          category: "Laptop",
          manufacturer: "Test Manufacturer",
          model: "Test Model",
          processor: "Test CPU",
          memoryGb: 16,
          operatingSystem: "Windows 11 Pro",
          windowsEdition: "Windows 11 Pro",
          windowsLicenseAssigned: true,
          antivirusProduct: "Kaspersky",
          softwareLicenses: ["Microsoft 365", "Adobe", "AutoCAD"],
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.employee).toMatchObject({
      email: employeeEmail,
      employeeName: "Handover Test Employee",
      jobTitle: "Operations Specialist",
    });
    expect(response.body.asset).toMatchObject({
      serialNumber,
      softwareLicenses: ["Microsoft 365", "Adobe", "AutoCAD"],
    });
    expect(response.body.assignment.issuedBy).toMatchObject({
      id: itUserId,
      email: itEmail,
    });
    expect(response.body.assignment.issuedByName).toBe("Test IT Specialist");
    expect(response.body.assignment.assignedAt).toBeDefined();
    expect(response.body.employee.password).toBeUndefined();
  });
});
