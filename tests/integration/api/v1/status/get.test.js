import orchestrator from "tests/orchestrator";
import { describe, expect, test } from "@jest/globals";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET to `/api/v1/status`", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);
      expect(responseBody).toEqual({
        updated_at: parsedUpdatedAt,
        dependencies: {
          database: true,
          email: true,
        },
      });
    });
  });

  describe("Authenticated user", () => {
    test("Commom user", async () => {
      const commomUser = await orchestrator.createLoggedUser();
      const response = await fetch("http://localhost:3000/api/v1/status", {
        headers: {
          Cookie: `session_id=${commomUser.session.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);
      expect(responseBody).toEqual({
        updated_at: parsedUpdatedAt,
        dependencies: {
          database: true,
          email: true,
        },
      });
    });
    test("Privileged user", async () => {
      const privilegedUser = await orchestrator.createLoggedUser();
      await orchestrator.addFeaturesToUser(privilegedUser, ["read:status:all"]);
      const response = await fetch("http://localhost:3000/api/v1/status", {
        headers: {
          Cookie: `session_id=${privilegedUser.session.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);
      expect(responseBody).toEqual({
        updated_at: parsedUpdatedAt,
        dependencies: {
          database: {
            version: "16.14",
            max_connections: 100,
            opened_connections: 1,
          },
          email: true,
        },
      });
    });
  });
});
