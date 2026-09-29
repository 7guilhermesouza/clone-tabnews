import orchestrator from "tests/orchestrator";
import { describe, expect, test } from "@jest/globals";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("POST to `/api/v1/status`", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status", {
        method: "POST",
      });
      expect(response.status).toBe(405);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "MethodNotAllowedError",
        message: "Method not allowed.",
        action:
          "Verifique na documentação os métodos permitidos para esta rota.",
        status_code: 405,
      });
    });
  });
});
