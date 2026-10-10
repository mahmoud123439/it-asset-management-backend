import request from "supertest";
import app from "../src/app";

describe("Role Authorization", () => {

  let employeeToken = "";

  const email =
    `employee${Date.now()}@test.com`;

  const password =
    "Password123";

  test("Register Employee", async () => {

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email,
        password
      });

    expect(response.status).toBe(201);

  });

  test("Login Employee", async () => {

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password
      });

    employeeToken = response.body.token;

    expect(employeeToken).toBeDefined();

  });

  test("Employee cannot create asset", async () => {

    const response = await request(app)
      .post("/api/assets")
      .set(
        "Authorization",
        `Bearer ${employeeToken}`
      )
      .send({
        name: "Test Laptop",
        serialNumber: `SN-${Date.now()}`,
        category: "Laptop",
        status: "AVAILABLE"
      });

    expect(response.status).toBe(403);

  });

});
