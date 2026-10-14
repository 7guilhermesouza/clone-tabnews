import { describe, test, expect, beforeAll } from "@jest/globals";
import setCookieParser from "set-cookie-parser";
import orchestrator from "@/tests/orchestrator.js";
import session from "@/model/session.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE to `/api/v1/sessions`", () => {
  test("With nonexistent token", async () => {
    const response = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "DELETE",
      headers: {
        Cookies: `session_id=4c5c4a07ed92f7a8d6ffb436b88c71cee72d9df25691c0593ff007d9524cd2b56209f5ed017f72b61c96a44536099770`,
      },
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

  test("With expired token", async () => {
    jest.useFakeTimers({
      now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
    });

    const createdUSer = await orchestrator.createUser();
    const sessionObject = await orchestrator.createSession(createdUSer.id);

    jest.useRealTimers();

    const response = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "DELETE",
      headers: {
        Cookies: `session_id=${sessionObject.token}`,
      },
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

  test("With valid token", async () => {
    const createdUser = await orchestrator.createUser();
    const sessionObject = await orchestrator.createSession(createdUser.id);
    const response = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "DELETE",
      headers: {
        Cookie: `session_id=${sessionObject.token}`,
      },
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      id: sessionObject.id,
      user_id: createdUser.id,
      token: sessionObject.token,
      expires_at: responseBody.expires_at,
      created_at: sessionObject.created_at.toISOString(),
      updated_at: responseBody.updated_at,
    });

    const expiresAtBefore = new Date(sessionObject.expires_at);
    const expiresAtAfter = new Date(responseBody.expires_at);

    expect(expiresAtBefore > expiresAtAfter).toBe(true);

    //Set Cookies
    const parsedSetCookie = setCookieParser(response, {
      map: true,
    });
    expect(parsedSetCookie.session_id).toEqual({
      name: "session_id",
      value: "invalid",
      maxAge: -1,
      path: "/",
      httpOnly: true,
    });

    //Double check
    const responseDoubleCheck = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      },
    );
    expect(responseDoubleCheck.status).toBe(401);
    const responseDoubleCheckBody = await responseDoubleCheck.json();
    expect(responseDoubleCheckBody).toEqual({
      name: "UnauthorizedError",
      message: "Credenciais não confere.",
      action: "Por favor, confira os dados enviados.",
      status_code: 401,
    });
  });
});
