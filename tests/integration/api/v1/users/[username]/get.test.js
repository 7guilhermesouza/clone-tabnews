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
      const userSameCaseResponse = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "samecase",
            email: "same.case@exemplo.com",
            password: "senha123",
          }),
        },
      );

      expect(userSameCaseResponse.status).toBe(201);

      const userSameCaseFoundedResponse = await fetch(
        "http://localhost:3000/api/v1/users/samecase",
      );

      expect(userSameCaseFoundedResponse.status).toBe(200);
      const userSameCaseResponseBody = await userSameCaseResponse.json();
      expect(userSameCaseResponseBody).toEqual({
        id: userSameCaseResponseBody.id,
        username: "samecase",
        email: "same.case@exemplo.com",
        password: "senha123",
        created_at: userSameCaseResponseBody.created_at,
        updated_at: userSameCaseResponseBody.updated_at,
      });
    });

    test("With diferent case", async () => {
      const userDiferentCaseResponse = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "diferentcase",
            email: "diferent.case@exemplo.com",
            password: "senha123",
          }),
        },
      );

      expect(userDiferentCaseResponse.status).toBe(201);

      const userDiferentCaseFoundedResponse = await fetch(
        "http://localhost:3000/api/v1/users/DIFERENTCASE",
      );

      expect(userDiferentCaseFoundedResponse.status).toBe(200);
      const userDiferentCaseResponseBody =
        await userDiferentCaseResponse.json();
      expect(userDiferentCaseResponseBody).toEqual({
        id: userDiferentCaseResponseBody.id,
        username: "diferentcase",
        email: "diferent.case@exemplo.com",
        password: "senha123",
        created_at: userDiferentCaseResponseBody.created_at,
        updated_at: userDiferentCaseResponseBody.updated_at,
      });
    });

    test("With nonexistent username", async () => {
      const userNonExistentResponse = await fetch(
        "http://localhost:3000/api/v1/users/userNonExist",
      );

      expect(userNonExistentResponse.status).toBe(404);
      const userNonExistentResponseBody = await userNonExistentResponse.json();
      expect(userNonExistentResponseBody).toEqual({
        name: "NotFoundError",
        message: "Não foram encontrados registros com os dados solicitados.",
        action:
          "Registros não encontrados. Por favor, confira os dados e tente novamente.",
        status_code: 404,
      });
    });
  });
});
