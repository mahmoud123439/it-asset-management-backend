import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/prisma";

describe("Device change request workflow", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const employeeEmail = `device-request-employee-${suffix}@test.invalid`;
  const itEmail = `device-request-it-${suffix}@test.invalid`;
  const password = "Temporary-Test-Only-123";
  let employeeId: number;
  let itUserId: number;
  let oldAssetId: number;
  let replacementAssetId: number;
  let employeeToken: string;
  let itToken: string;

  beforeAll(async () => {
    const [employeeGroup, itGroup] = await Promise.all([
      prisma.workGroup.findUniqueOrThrow({
        where: { slug: "employees" },
        select: { id: true },
      }),
      prisma.workGroup.findUniqueOrThrow({
        where: { slug: "it" },
        select: { id: true },
      }),
    ]);
    const [employee, itUser] = await Promise.all([
      prisma.user.create({
        data: {
          email: employeeEmail,
          password,
          role: "EMPLOYEE",
          workGroups: { create: { groupId: employeeGroup.id } },
        },
        select: { id: true },
      }),
      prisma.user.create({
        data: {
          email: itEmail,
          password,
          role: "IT_ENGINEER",
          employeeName: "Device Request IT",
          workGroups: { create: { groupId: itGroup.id } },
        },
        select: { id: true },
      }),
    ]);

    employeeId = employee.id;
    itUserId = itUser.id;
    employeeToken = jwt.sign(
      { userId: employeeId, role: "EMPLOYEE" },
      process.env.JWT_SECRET!,
    );
    itToken = jwt.sign(
      { userId: itUserId, role: "IT_ENGINEER" },
      process.env.JWT_SECRET!,
    );

    const oldAsset = await prisma.asset.create({
      data: {
        name: "Old device request laptop",
        serialNumber: `REQ-OLD-${suffix}`,
        category: "Laptop",
        status: "ASSIGNED",
      },
      select: { id: true },
    });
    const replacementAsset = await prisma.asset.create({
      data: {
        name: "Replacement request laptop",
        serialNumber: `REQ-NEW-${suffix}`,
        category: "Laptop",
        status: "AVAILABLE",
      },
      select: { id: true },
    });
    oldAssetId = oldAsset.id;
    replacementAssetId = replacementAsset.id;
    await prisma.assetAssignment.create({
      data: { userId: employeeId, assetId: oldAssetId },
    });
  });

  afterAll(async () => {
    await prisma.$transaction(async (tx) => {
      await tx.deviceChangeRequest.deleteMany({ where: { userId: employeeId } });
      await tx.assetAssignment.deleteMany({ where: { userId: employeeId } });
      await tx.asset.deleteMany({
        where: { id: { in: [oldAssetId, replacementAssetId] } },
      });
      await tx.user.deleteMany({ where: { id: { in: [employeeId, itUserId] } } });
    });
  });

  test("only IT can update and clear RAM and storage specifications", async () => {
    const employeeUpdate = await request(app)
      .put(`/api/assets/${oldAssetId}`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        name: "Old device request laptop",
        serialNumber: `REQ-OLD-${suffix}`,
        category: "Laptop",
        status: "ASSIGNED",
        memoryGb: 32,
        storageGb: 1024,
        storageType: "NVMe",
      });
    expect(employeeUpdate.status).toBe(403);

    const updated = await request(app)
      .put(`/api/assets/${oldAssetId}`)
      .set("Authorization", `Bearer ${itToken}`)
      .send({
        name: "Old device request laptop",
        serialNumber: `REQ-OLD-${suffix}`,
        category: "Laptop",
        status: "ASSIGNED",
        memoryGb: 32,
        storageGb: 1024,
        storageType: "NVMe SSD",
      });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      memoryGb: 32,
      storageGb: 1024,
      storageType: "NVMe SSD",
    });

    const profile = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(profile.status).toBe(200);
    expect(profile.body.assignments[0].asset).toMatchObject({
      memoryGb: 32,
      storageGb: 1024,
      storageType: "NVMe SSD",
    });

    const cleared = await request(app)
      .put(`/api/assets/${oldAssetId}`)
      .set("Authorization", `Bearer ${itToken}`)
      .send({
        name: "Old device request laptop",
        serialNumber: `REQ-OLD-${suffix}`,
        category: "Laptop",
        status: "ASSIGNED",
        memoryGb: null,
        storageGb: null,
        storageType: null,
      });
    expect(cleared.status).toBe(200);
    expect(cleared.body).toMatchObject({
      memoryGb: null,
      storageGb: null,
      storageType: null,
    });
  });

  test("employee request is private and IT replacement updates both assignment records atomically", async () => {
    const createResponse = await request(app)
      .post("/api/device-requests")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        assetId: oldAssetId,
        type: "REPLACE_DEVICE",
        message: "Please replace my current laptop.",
      });

    expect(createResponse.status).toBe(201);
    const requestId = createResponse.body.id as number;

    const employeeRequests = await request(app)
      .get("/api/device-requests")
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(employeeRequests.status).toBe(200);
    expect(employeeRequests.body).toHaveLength(1);
    expect(employeeRequests.body[0].user.id).toBe(employeeId);

    const forbiddenReview = await request(app)
      .patch(`/api/device-requests/${requestId}`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ status: "APPROVED" });
    expect(forbiddenReview.status).toBe(403);

    const prematureReplacement = await request(app)
      .post("/api/assignments/replace-requested")
      .set("Authorization", `Bearer ${itToken}`)
      .send({ requestId, replacementAssetId });
    expect(prematureReplacement.status).toBe(409);

    const approved = await request(app)
      .patch(`/api/device-requests/${requestId}`)
      .set("Authorization", `Bearer ${itToken}`)
      .send({ status: "APPROVED", resolutionNote: "Replacement approved." });
    expect(approved.status).toBe(200);

    const replaced = await request(app)
      .post("/api/assignments/replace-requested")
      .set("Authorization", `Bearer ${itToken}`)
      .send({
        requestId,
        replacementAssetId,
        issuedByName: "Device Request IT",
      });
    expect(replaced.status).toBe(200);
    expect(replaced.body.status).toBe("COMPLETED");

    const [oldAsset, replacementAsset, assignmentHistory] = await Promise.all([
      prisma.asset.findUniqueOrThrow({ where: { id: oldAssetId } }),
      prisma.asset.findUniqueOrThrow({ where: { id: replacementAssetId } }),
      prisma.assetAssignment.findMany({
        where: { userId: employeeId },
        orderBy: { assignedAt: "asc" },
      }),
    ]);
    expect(oldAsset.status).toBe("MAINTENANCE");
    expect(replacementAsset.status).toBe("ASSIGNED");
    expect(assignmentHistory).toHaveLength(2);
    expect(assignmentHistory[0].returnedAt).toBeInstanceOf(Date);
    expect(assignmentHistory[1]).toMatchObject({
      assetId: replacementAssetId,
      issuedByUserId: itUserId,
      issuedByName: "Device Request IT",
      returnedAt: null,
    });
  });
});
