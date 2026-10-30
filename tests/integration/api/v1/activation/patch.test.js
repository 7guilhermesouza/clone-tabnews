import { describe, test, expect, beforeAll } from "@jest/globals";
import orchestrator from "@/tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("PATCH to `/api/v1/activation/[token]", () => {
  test("With a used activation token and a anonymous user", async () => {
    const user = await orchestrator.createUser();
    const usedActivationToken = await orchestrator.activateUser(user.id);
    const response = await fetch(
      `http://localhost:3000/api/v1/activation/${usedActivationToken.id}`,
      {
        method: "PATCH",
      },
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

  test("With a user with a opened session", async () => {
    const createdUser = await orchestrator.createUser();
    const usedActivationToken = await orchestrator.activateUser(createdUser.id);
    const userSession = await orchestrator.createSession(createdUser.id);

    const response = await fetch(
      `http://localhost:3000/api/v1/activation/${usedActivationToken.id}`,
      {
        method: "PATCH",
        headers: {
          Cookie: `session_id=${userSession.token}`,
        },
      },
    );
    expect(response.status).toBe(403);
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      message: "Acesso negado. Você não tem permissão para executar esta ação.",
      name: "ForbiddenError",
      action:
        "Por favor, verifique suas permissões com os administradores ou entre em contato com o suporte.",
      status_code: 403,
    });
  });

  test("Activate succesfully", async () => {
    const createdUser = await orchestrator.createUser();
    const ActivationToken = await orchestrator.createActivationToken(
      createdUser.id,
    );
    const response = await fetch(
      `http://localhost:3000/api/v1/activation/${ActivationToken.id}`,
      {
        method: "PATCH",
      },
    );
    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      user_id: responseBody.user_id,
      used_at: responseBody.used_at,
      expires_at: responseBody.expires_at,
    });
  });

  test("With a different user", async () => {
    const newUser1 = await orchestrator.createActivatedUser();
    const newSessionUser1 = await orchestrator.createSession(newUser1.id);
    const newUser2 = await orchestrator.createUser();
    const newUser2ActivationToken = await orchestrator.createActivationToken(
      newUser2.id,
    );

    const response = await fetch(
      `http://localhost:3000/api/v1/activation/${newUser2ActivationToken.id}`,
      {
        method: "PATCH",
        headers: {
          Cookie: `session_id=${newSessionUser1.token}`,
        },
      },
    );

    expect(response.status).toBe(403);
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      message: "Acesso negado. Você não tem permissão para executar esta ação.",
      name: "ForbiddenError",
      action:
        "Por favor, verifique suas permissões com os administradores ou entre em contato com o suporte.",
      status_code: 403,
    });
  });
});
