import orchestrator from "tests/orchestrator";
import { describe, expect, test } from "@jest/globals";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatase();
});

describe("Consulting pending migrations via GET request to /migrations", () => {
  describe("Anonymous user", () => {
    test("Should existis migrations to run", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");
      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBeGreaterThan(0);
    });
  });
});
