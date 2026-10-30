/* secretlint-disable -- senhas fictícias, apenas para validar comportamentos da aplicação. */

import { beforeAll, describe, expect, test } from "@jest/globals";
import orchestrator from "@/tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatase();
  await orchestrator.runPendingMigrations();
});

describe("GET to `api/v1/users/[username]`", () => {
  describe("With Anonymous user", () => {
    test("With exact case", async () => {
      const createdUser = await orchestrator.createUser();
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("With diferent case", async () => {
      const createdUser = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username.toUpperCase()}`,
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("With nonexistent username", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/userNonExist",
      );

      expect(response.status).toBe(404);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Não foram encontrados registros com os dados solicitados.",
        action:
          "Registros não encontrados. Por favor, confira os dados e tente novamente.",
        status_code: 404,
      });
    });
  });

  describe("With authenticated user", () => {
    test("Get public data about yourself or other user", async () => {
      const loggedUser = await orchestrator.createLoggedUser({
        username: "loggedUser",
      });
      const anotherUser = await orchestrator.createUser({
        username: "anotherUser",
      });

      const selfResponse = await fetch(
        `http://localhost:3000/api/v1/users/${loggedUser.username}`,
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${loggedUser.session.token}`,
          },
        },
      );

      expect(selfResponse.status).toBe(200);
      const selfResponseBody = await selfResponse.json();
      expect(selfResponseBody).toEqual({
        id: loggedUser.id,
        username: loggedUser.username,
        features: loggedUser.features,
        created_at: loggedUser.created_at.toISOString(),
        updated_at: loggedUser.updated_at.toISOString(),
      });

      const othersResponse = await fetch(
        `http://localhost:3000/api/v1/users/${anotherUser.username}`,
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${loggedUser.session.token}`,
          },
        },
      );

      expect(othersResponse.status).toBe(200);
      const othersResponseBody = await othersResponse.json();
      expect(othersResponseBody).toEqual({
        id: anotherUser.id,
        username: anotherUser.username,
        features: anotherUser.features,
        created_at: anotherUser.created_at.toISOString(),
        updated_at: anotherUser.updated_at.toISOString(),
      });
    });
  });
});
