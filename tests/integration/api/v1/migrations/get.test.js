import orchestrator from "tests/orchestrator";
import { beforeAll, afterAll, describe, expect, test } from "@jest/globals";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatase();
  await orchestrator.runPendingMigrations();
});

describe("Consulting pending migrations via GET request to /migrations", () => {
  describe("Anonymous user", () => {
    test("GET to /migrations by anonymous user", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");
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
  describe("Authenticated user", () => {
    test("Request by a commom user", async () => {
      const commomUser = await orchestrator.createLoggedUser();
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${commomUser.session.token}`,
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

    test("Request by a privileged user", async () => {
      const privilegedUser = await orchestrator.createLoggedUser();
      await orchestrator.addFeaturesToUser(privilegedUser, ["read:migrations"]);

      await orchestrator.createFakeMigration();

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${privilegedUser.session.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBeGreaterThan(0);
    });
  });
});

afterAll(async () => {
  await orchestrator.deleteFakeMigration();
});
