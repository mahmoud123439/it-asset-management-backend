import request from "supertest";
import app from "../src/app";

describe("CORS origin policy", () => {
  test("allows the configured local frontend", async () => {
    const response = await request(app)
      .get("/")
      .set("Origin", "https://smart-it.local:5174");

    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://smart-it.local:5174",
    );
  });

  test("does not grant browser access to an unconfigured origin", async () => {
    const response = await request(app)
      .get("/")
      .set("Origin", "https://untrusted.example");

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
