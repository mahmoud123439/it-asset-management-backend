import request from "supertest";
import app from "../src/app";

describe("Assignment API Security", () => {

  test("GET /api/assignments without token", async () => {

    const response = await request(app)
      .get("/api/assignments");

    expect(response.status).toBe(401);

  });

  test("POST /api/assignments without token", async () => {

    const response = await request(app)
      .post("/api/assignments")
      .send({
        userId: 1,
        assetId: 1
      });

    expect(response.status).toBe(401);

  });

  test("POST /api/assignments/return without token", async () => {

    const response = await request(app)
      .post("/api/assignments/return")
      .send({
        assetId: 1
      });

    expect(response.status).toBe(401);

  });

});
