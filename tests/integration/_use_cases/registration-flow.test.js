import { describe, test, expect, beforeAll } from "@jest/globals";
import orchestrator from "@/tests/orchestrator.js";
import activation from "@/model/activation.js";
import webserver from "@/infra/webserver.js";
import user from "@/model/user";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: registration flow (all successful)", () => {
  let createdUser;
  let activationToken;
  test("Create user account", async () => {
    const createdUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration.flow@exemplo.com",
          password: "registration",
        }),
      },
    );

    expect(createdUserResponse.status).toBe(201);
    createdUser = await createdUserResponse.json();

    expect(createdUser).toEqual({
      id: createdUser.id,
      username: "RegistrationFlow",
      features: ["read:activation_token"],
      created_at: createdUser.created_at,
      updated_at: createdUser.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<no-reply@exemplo.com>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@exemplo.com>");
    expect(lastEmail.subject).toBe("Ative sua conta no sistema");
    expect(lastEmail.text).toContain("RegistrationFlow");

    const foundActivationToken = orchestrator.FindActivationTokenInEmail(
      lastEmail.text,
    );

    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${foundActivationToken}`,
    );

    activationToken =
      await activation.findOneValidByActivationToken(foundActivationToken);

    expect(createdUser.id).toBe(activationToken.user_id);
    expect(activationToken.used_at).toBe(null);
  });

  test("Activate account", async () => {
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activation/${activationToken.id}`,
      {
        method: "PATCH",
      },
    );
    expect(activationResponse.status).toBe(200);

    const activationResponseBody = await activationResponse.json();

    expect(activationResponseBody.used_at).not.toBeNaN();

    const activatedUser = await user.findOneById(
      activationResponseBody.user_id,
    );
    expect(activatedUser.features).toEqual([
      "read:status",
      "create:session",
      "delete:session",
      "read:user",
      "update:user",
    ]);
  });

  test("login by valid user", async () => {
    const createdSessionResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "registration.flow@exemplo.com",
          password: "registration",
        }),
      },
    );

    expect(createdSessionResponse.status).toBe(201);
    const createdSessionResponseBody = await createdSessionResponse.json();
    expect(createdSessionResponseBody).toEqual({
      expires_at: createdSessionResponseBody.expires_at,
      created_at: createdSessionResponseBody.created_at,
    });
    expect(Date.parse(createdSessionResponseBody.expires_at)).not.toBeNaN();
    expect(Date.parse(createdSessionResponseBody.created_at)).not.toBeNaN();
  });

  test("login by deactivated user", async () => {
    await orchestrator.deactivateUser(createdUser);

    const createdSessionResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "registration.flow@exemplo.com",
          password: "registration",
        }),
      },
    );

    expect(createdSessionResponse.status).toBe(403);
  });
});
