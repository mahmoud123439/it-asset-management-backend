import request from "supertest";
import app from "../src/app";

describe("Authorization Flow", () => {

  let token = "";

  const email =
    `auth${Date.now()}@test.com`;

  const password =
    "Password123";

  test("Register User", async () => {

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password
      });

    expect(response.status).toBe(201);

  });

  test("Login User", async () => {

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password
      });

    token = response.body.token;

    expect(token).toBeDefined();

  });

  test("Access Protected Route", async () => {

    const response = await request(app)
      .get("/api/assets")
      .set(
        "Authorization",
        `Bearer ${token}`
      );

    expect(response.status).not.toBe(401);

  });

});
