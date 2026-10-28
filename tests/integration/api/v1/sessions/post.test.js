import { beforeAll, expect, describe, test } from "@jest/globals";
import setCookieParser from "set-cookie-parser";
import orchestrator from "@/tests/orchestrator.js";
import session from "@/model/session.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatase();
  await orchestrator.runPendingMigrations();
});

describe("POST to 'api/v1/sessions", () => {
  test("With correct 'email' and incorrect 'password'", async () => {
    await orchestrator.createActivatedUser({
      email: "email.correto@exemplo.com",
    });

    const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "email.correto@exemplo.com",
        password: "senha-errada",
      }),
    });

    expect(response.status).toBe(401);

    const responseBody = await response.json();

    expect(responseBody).toEqual({
      name: "UnauthorizedError",
      message: "Credenciais não confere.",
      action: "Por favor, confira os dados enviados.",
      status_code: 401,
    });
  });

  test("With incorrect 'email' and correct 'password'", async () => {
    await orchestrator.createUser({
      password: "senha-correta",
    });

    const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "email.incorreto@exemplo.com",
        password: "senha-correta",
      }),
    });

    expect(response.status).toBe(401);

    const responseBody = await response.json();

    expect(responseBody).toEqual({
      name: "UnauthorizedError",
      message: "Credenciais não confere.",
      action: "Por favor, confira os dados enviados.",
      status_code: 401,
    });
  });

  test("With valid data", async () => {
    const createdUser1 = await orchestrator.createActivatedUser({
      email: "tudo.correto@exemplo.com.br",
      password: "senhaCorreta",
    });
    const response = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: createdUser1.email,
        password: "senhaCorreta",
      }),
    });

    expect(response.status).toBe(201);

    const responseBody = await response.json();
    expect(responseBody).toEqual({
      expires_at: responseBody.expires_at,
      created_at: responseBody.created_at,
    });
    expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
    expect(Date.parse(responseBody.created_at)).not.toBeNaN();

    const expiresAt = new Date(responseBody.expires_at);
    const createdAt = new Date(responseBody.created_at);
    expiresAt.setMilliseconds(0);
    createdAt.setMilliseconds(0);
    expect(expiresAt - createdAt).toBe(session.EXPIRATION_IN_MILLISECONDS);

    const parsedSetCookie = setCookieParser(response, {
      map: true,
    });
    expect(parsedSetCookie.session_id).toEqual({
      name: "session_id",
      value: parsedSetCookie.session_id.value,
      maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
      path: "/",
      httpOnly: true,
    });
    expect(/[a-zA-z0-9]*/.test(parsedSetCookie.session_id.value)).toBe(true);
  });
});
