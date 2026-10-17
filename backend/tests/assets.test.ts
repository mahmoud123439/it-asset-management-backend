import request from "supertest";
import app from "../src/app";

describe("Assets API", () => {

  test("GET /api/assets should reject requests without token", async () => {

    const response = await request(app)
      .get("/api/assets");

    expect(response.status).toBe(401);

  });

  test("GET /api/assets should return unauthorized message", async () => {

    const response = await request(app)
      .get("/api/assets");

    expect(response.body.message).toBe("Unauthorized");

  });

});
