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
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "romario",
          email: "romario@exemplo.com",
          password: "Senha@123",
        }),
      });
      expect(user1Response.status).toBe(201);

      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "bebeto",
          email: "bebeto@exemplo.com",
          password: "Senha@123",
        }),
      });

      expect(user2Response.status).toBe(201);
      const usernameDuplicateResponse = await fetch(
        "http://localhost:3000/api/v1/users/romario",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "bebeto",
          }),
        },
      );

      expect(usernameDuplicateResponse.status).toBe(400);
    });

    test("With duplicate `email`", async () => {
      const emailDuplicateResponse = await fetch(
        "http://localhost:3000/api/v1/users/romario",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "bebeto@exemplo.com",
          }),
        },
      );

      expect(emailDuplicateResponse.status).toBe(400);
    });

    test("update your own username", async () => {
      const emailDuplicateResponse = await fetch(
        "http://localhost:3000/api/v1/users/romario",
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

      expect(emailDuplicateResponse.status).toBe(200);
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
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });
});
