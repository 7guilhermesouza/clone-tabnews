/* secretlint-disable -- arquivo de tests, usa apenas senhas fictícias */
import orchestrator from "@/tests/orchestrator";
import { beforeAll, expect, test, describe } from "@jest/globals";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH to `ap1/v1/users/[username]", () => {
  describe("With Anonymous user", () => {
    test("With duplicate `username`", async () => {
      const user1 = await orchestrator.createUser();
      const user2 = await orchestrator.createUser();
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: user1.username,
          }),
        },
      );

      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action:
          "Dados inválidos. Por favor, confira os dados e tente novamente.",
        message: "Não foi possível validar os dados enviados.",
        name: "ValidationError",
        status_code: 400,
      });
    });

    test("With duplicate `email`", async () => {
      const user1 = await orchestrator.createUser();
      const user2 = await orchestrator.createUser();
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user1.email,
          }),
        },
      );

      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action:
          "Dados inválidos. Por favor, confira os dados e tente novamente.",
        message: "Não foi possível validar os dados enviados.",
        name: "ValidationError",
        status_code: 400,
      });
    });

    test("update your own username", async () => {
      const user1 = await orchestrator.createUser();
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "Romario",
          }),
        },
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "Romario",
        email: user1.email,
        password: responseBody.password,
        features: [],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With valid user", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/romario",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "BaixinhoRomario",
            email: "baixinho.romario@gmail.com",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "BaixinhoRomario",
        email: "baixinho.romario@gmail.com",
        password: responseBody.password,
        features: [],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });
});
