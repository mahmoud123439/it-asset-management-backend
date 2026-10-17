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
      expect(response.body.password).toBeUndefined();
    });
  });

  describe("Role restrictions", () => {
    test("EMPLOYEE cannot list users", async () => {
      const response = await request(app).get("/api/users").set(auth());

      expect(response.status).toBe(403);
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
    test("any authenticated user can list departments", async () => {
      const response = await request(app).get("/api/departments").set(auth());

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
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
