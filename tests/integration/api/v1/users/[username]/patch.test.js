/* secretlint-disable -- arquivo de tests, usa apenas senhas fictícias */
import orchestrator from "@/tests/orchestrator";
import { beforeAll, expect, test, describe } from "@jest/globals";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH to `ap1/v1/users/[username]", () => {
  describe("With Anonymous user", () => {
    test("Update `username`", async () => {
      const user1 = await orchestrator.createLoggedUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "NewUsernameViaAPI",
          }),
        },
      );

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
  describe("With  default authenticated user", () => {
    test("With duplicate `username`", async () => {
      const user1 = await orchestrator.createLoggedUser();
      const user2 = await orchestrator.createLoggedUser();
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${user1.session.token}`,
          },
          body: JSON.stringify({
            username: user2.username,
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
      const user1 = await orchestrator.createLoggedUser();
      const user2 = await orchestrator.createLoggedUser();
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${user1.session.token}`,
          },
          body: JSON.stringify({
            email: user2.email,
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
      const updateUsernameUser = await orchestrator.createLoggedUser();
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${updateUsernameUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${updateUsernameUser.session.token}`,
          },
          body: JSON.stringify({
            username: "romario",
          }),
        },
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: updateUsernameUser.id,
        username: "romario",
        features: [
          "read:status",
          "create:session",
          "delete:session",
          "read:user",
          "update:user",
        ],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
    test("update case of your own username", async () => {
      const updateCaseUser = await orchestrator.createLoggedUser({
        username: "MarcoS",
      });
      const response = await fetch(
        `http://localhost:3000/api/v1/users/marcos`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${updateCaseUser.session.token}`,
          },
          body: JSON.stringify({
            username: "marcos",
          }),
        },
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: updateCaseUser.id,
        username: "marcos",
        features: [
          "read:status",
          "create:session",
          "delete:session",
          "read:user",
          "update:user",
        ],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
      expect(uuidVersion(updateCaseUser.id)).toBe(4);
      expect(Date.parse(updateCaseUser.created_at)).not.toBeNaN();
      expect(Date.parse(updateCaseUser.updated_at)).not.toBeNaN();
    });

    test("Edit another user profile", async () => {
      const loggedUser = await orchestrator.createLoggedUser();
      const anotherUser = await orchestrator.createUser();
      const othersResponse = await fetch(
        `http://localhost:3000/api/v1/users/${anotherUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${loggedUser.session.token}`,
          },
          body: JSON.stringify({
            username: "AnotherProfilEditViaAPI",
          }),
        },
      );

      expect(othersResponse.status).toBe(403);
      const responseBody = await othersResponse.json();

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
  describe("With privileged user", () => {
    test("Update a different user", async () => {
      const privilegedUser = await orchestrator.createLoggedUser();
      await orchestrator.addFeaturesToUser(privilegedUser, [
        "update:user:others",
      ]);
      const commomUser = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${commomUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${privilegedUser.session.token}`,
          },
          body: JSON.stringify({
            username: "UpdatedByPrivilegedUser",
          }),
        },
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: commomUser.id,
        username: "UpdatedByPrivilegedUser",
        features: commomUser.features,
        created_at: commomUser.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(commomUser.id)).toBe(4);
      expect(Date.parse(commomUser.created_at)).not.toBeNaN();
      expect(Date.parse(commomUser.updated_at)).not.toBeNaN();
    });
  });
});
