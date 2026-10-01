/* secretlint-disable -- senhas fictícias usadas apenas em testes */
import orchestrator from "tests/orchestrator";
import { describe, expect, test } from "@jest/globals";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatase();
  await orchestrator.runPendingMigrations();
});

describe("Create a user via POST request to /users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "Guilhermesouza",
          email: "Guilherme@exemplo.com",
          password: "Senha@123",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "Guilhermesouza",
        email: "Guilherme@exemplo.com",
        password: "Senha@123",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With duplicated email", async () => {
      const validUserResponse = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "UsuarioEmailDuplicado",
            email: "duplicado@exemplo.com",
            password: "senha123",
          }),
        },
      );
      //const validUserResponseBody = await validUserResponse.json();
      console.log(validUserResponse);
      expect(validUserResponse.status).toBe(201);

      const duplicatedUserResponse = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "UsuarioComEmailDuplicado",
            email: "DUPLICADO@exemplo.com",
            password: "senha123",
          }),
        },
      );
      const duplicatedUserResponseBody = await duplicatedUserResponse.json();
      console.log(duplicatedUserResponseBody);
      expect(duplicatedUserResponse.status).toBe(400);
      expect(duplicatedUserResponseBody).toEqual({
        name: "ValidationError",
        message: "Não foi possível validar os dados enviados.",
        action:
          "Dados inválidos. Por favor, confira os dados e tente novamente.",
        status_code: 400,
      });
    });

    test("With duplicated username", async () => {
      const validUserResponse = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "UsernameDuplicado",
            email: "userduplicado@exemplo.com",
            password: "senha123",
          }),
        },
      );
      //const validUserResponseBody = await validUserResponse.json();
      console.log(validUserResponse);
      expect(validUserResponse.status).toBe(201);

      const duplicatedUserResponse = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "UsernameDuplicado",
            email: "duplicadousername@exemplo.com",
            password: "senha123",
          }),
        },
      );
      const duplicatedUserResponseBody = await duplicatedUserResponse.json();
      console.log(duplicatedUserResponseBody);
      expect(duplicatedUserResponse.status).toBe(400);
      expect(duplicatedUserResponseBody).toEqual({
        name: "ValidationError",
        message: "Não foi possível validar os dados enviados.",
        action:
          "Dados inválidos. Por favor, confira os dados e tente novamente.",
        status_code: 400,
      });
    });
  });
});
