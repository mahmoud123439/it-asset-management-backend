import request from "supertest";
import app from "../src/app";

describe("API improvements", () => {
  let token = "";

  const email = `improve${Date.now()}@test.com`;
  const password = "Password123";

  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    await request(app).post("/api/auth/register").send({ email, password });

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    token = login.body.token;
  });

  describe("GET /api/auth/me", () => {
    test("rejects requests without a token", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
    });

    test("returns the current user without the password", async () => {
      const response = await request(app).get("/api/auth/me").set(auth());

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(email);
      expect(response.body.role).toBe("EMPLOYEE");
      expect(response.body.workGroups).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            group: expect.objectContaining({ slug: "employees" }),
          }),
        ]),
      );
      expect(response.body.assignments).toEqual([]);
      expect(response.body).not.toHaveProperty("users");
      expect(JSON.stringify(response.body)).not.toContain('"password"');
    });
  });

  describe("Role restrictions", () => {
    test("employees can only create requests for a device currently assigned to them", async () => {
      const response = await request(app)
        .post("/api/device-requests")
        .set(auth())
        .send({
          assetId: 999999,
          type: "REPLACE_DEVICE",
          message: "Please replace my assigned laptop.",
        });

      expect(response.status).toBe(403);
    });

    test("employees cannot review device change requests", async () => {
      const response = await request(app)
        .patch("/api/device-requests/1")
        .set(auth())
        .send({ status: "APPROVED" });

      expect(response.status).toBe(403);
    });

    test("employees only see their own device requests", async () => {
      const response = await request(app)
        .get("/api/device-requests")
        .set(auth());

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test("EMPLOYEE cannot list users", async () => {
      const response = await request(app).get("/api/users").set(auth());

      expect(response.status).toBe(403);
    });

    test("EMPLOYEE cannot list work groups", async () => {
      const response = await request(app).get("/api/users/groups").set(auth());

      expect(response.status).toBe(403);
    });

    test("EMPLOYEE cannot provision a device and employee account", async () => {
      const response = await request(app)
        .post("/api/onboarding/device")
        .set(auth())
        .send({
          email: `provision${Date.now()}@test.com`,
          password: "Password123",
          employeeName: "Test Employee",
          jobTitle: "Accountant",
          asset: {
            name: "Restricted laptop",
            serialNumber: `RESTRICTED-${Date.now()}`,
            category: "Laptop",
            windowsEdition: "Windows 11 Pro",
            windowsLicenseAssigned: true,
            antivirusProduct: "Kaspersky",
            softwareLicenses: ["Microsoft 365", "Kaspersky", "Adobe", "AutoCAD"],
          },
        });

      expect(response.status).toBe(403);
    });

    test("EMPLOYEE sees only assets currently assigned to their account", async () => {
      const response = await request(app)
        .get("/api/assets?search=MP2S065F")
        .set(auth());

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    test("EMPLOYEE cannot create users", async () => {
      const response = await request(app)
        .post("/api/users")
        .set(auth())
        .send({
          email: `hacker${Date.now()}@test.com`,
          password: "Password123",
          role: "ADMIN",
        });

      expect(response.status).toBe(403);
    });

    test("EMPLOYEE cannot create departments", async () => {
      const response = await request(app)
        .post("/api/departments")
        .set(auth())
        .send({ name: `Dept ${Date.now()}` });

      expect(response.status).toBe(403);
    });
  });

  describe("Departments", () => {
    test("EMPLOYEE cannot list organization departments", async () => {
      const response = await request(app).get("/api/departments").set(auth());

      expect(response.status).toBe(403);
    });
  });

  describe("Assets pagination and validation", () => {
    test("returns { data, meta }", async () => {
      const response = await request(app).get("/api/assets").set(auth());

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
    });

    test("treats empty query values as not provided", async () => {
      const response = await request(app)
        .get("/api/assets?search=&status=&category=")
        .set(auth());

      expect(response.status).toBe(200);
    });

    test("rejects limit above 100", async () => {
      const response = await request(app)
        .get("/api/assets?limit=1000")
        .set(auth());

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
    });

    test("rejects an invalid status filter", async () => {
      const response = await request(app)
        .get("/api/assets?status=BROKEN")
        .set(auth());

      expect(response.status).toBe(400);
    });

    test("rejects a non numeric asset id", async () => {
      const response = await request(app)
        .get("/api/assets/abc")
        .set(auth());

      expect(response.status).toBe(400);
    });
  });

  describe("Assignments pagination", () => {
    test("returns { data, meta }", async () => {
      const response = await request(app)
        .get("/api/assignments?active=true")
        .set(auth());

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });

    test("rejects an invalid active filter", async () => {
      const response = await request(app)
        .get("/api/assignments?active=maybe")
        .set(auth());

      expect(response.status).toBe(400);
    });
  });
});
