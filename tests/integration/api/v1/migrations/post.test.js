import orchestrator from "tests/orchestrator";
import { beforeAll, afterAll, describe, expect, test } from "@jest/globals";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatase();
  await orchestrator.runPendingMigrations();
});

describe("Running migrations via POST request to /migrations", () => {
  describe("Anonymous user", () => {
    test("POST to /migrations by anonymous user", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
      });
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        message:
          "Acesso negado. Você não tem permissão para executar esta ação.",
        name: "ForbiddenError",
        action:
          "Por favor, verifique suas permissões com os administradores ou entre em contato com o suporte.",
        status_code: 403,
      });
    });
  });

  describe("Common user", () => {
    test("POST to /migrations by common user", async () => {
      const commonUser = await orchestrator.createLoggedUser();
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
        headers: {
          Cookie: `session_id=${commonUser.session.token}`,
        },
      });
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        message:
          "Acesso negado. Você não tem permissão para executar esta ação.",
        name: "ForbiddenError",
        action:
          "Por favor, verifique suas permissões com os administradores ou entre em contato com o suporte.",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("POST to /migrations by privileged user", async () => {
      const privilegedUser = await orchestrator.createLoggedUser();
      await orchestrator.addFeaturesToUser(privilegedUser, [
        "create:migrations",
      ]);
      await orchestrator.createFakeMigration();
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
        headers: {
          Cookie: `session_id=${privilegedUser.session.token}`,
        },
      });
      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBeGreaterThan(0);
    });
  });
});

afterAll(async () => {
  await orchestrator.deleteFakeMigration();
});
