import request from "supertest";
import app from "../src/app";

describe("Home API", () => {

  test("GET / should return application message", async () => {

    const response = await request(app)
      .get("/");

    expect(response.status).toBe(200);

    expect(response.body.message)
      .toContain("IT Asset Management API");

  });

});
