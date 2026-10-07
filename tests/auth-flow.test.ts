import request from "supertest";
import app from "../src/app";

describe("Authentication Flow", () => {

  const email =
    `test${Date.now()}@example.com`;

  const password =
    "Password123";

  test("POST /api/auth/register", async () => {

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password
      });

    expect(response.status).toBe(201);

    expect(response.body.email)
      .toBe(email);

  });

  test("POST /api/auth/login", async () => {

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password
      });

    expect(response.status).toBe(200);

    expect(response.body.token)
      .toBeDefined();

  });

});
