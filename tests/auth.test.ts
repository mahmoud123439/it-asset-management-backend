import request from "supertest";
import app from "../src/app";

describe("Authentication API", () => {

  test("POST /api/auth/login should fail with invalid credentials", async () => {

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wrong@test.com",
        password: "wrongpassword"
      });

    expect(response.status).toBe(400);
  });

  test("POST /api/auth/login should validate input", async () => {

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "abc",
        password: "12"
      });

    expect(response.status).toBe(400);
  });

});
