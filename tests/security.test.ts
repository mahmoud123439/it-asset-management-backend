import request from "supertest";
import app from "../src/app";

describe("Protected Routes", () => {

  test("GET /api/assets should reject anonymous requests", async () => {

    const response = await request(app)
      .get("/api/assets");

    expect(response.status).toBe(401);

  });

});
