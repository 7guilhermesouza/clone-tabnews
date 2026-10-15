import { describe, test, expect, beforeAll } from "@jest/globals";
import setCookieParser from "set-cookie-parser";
import orchestrator from "@/tests/orchestrator.js";
import session from "@/model/session.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatase();
  await orchestrator.runPendingMigrations();
});

describe("GET to `api/v1/user`", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });
      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithValidSession",
        email: createdUser.email,
        password: createdUser.password,
        features: [],
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });
      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });

    test("With nonexistent session", async () => {
      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=34dc0a771102946d7fc8123fgef59cbfa3b92b3cf6e19c9279aef4943563e013fc3eb7fa45e4808f76c86a5f789awdfr`,
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
    });

    test("With expired session", async () => {
      const differenceInMilliseconds = 60 * 60 * 24 * 32 * 1000;

      jest.useFakeTimers({
        now: new Date(Date.now() - differenceInMilliseconds),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });
      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
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
    });

    test("With session in use", async () => {
      const differenceInMilliseconds = 60 * 60 * 24 * 15 * 1000;

      jest.useFakeTimers({
        now: new Date(Date.now() - differenceInMilliseconds),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithSessionInUse",
      });
      const sessionObject = await orchestrator.createSession(createdUser.id);

      /*Independente se eu chamar este método aqui ou após o response feito abaixo, não haverá diferença no processo,
      porque cada processo roda em um local diferente. E este fake timer está em um processo diferente do meu servidor
      e não fará efeito no servidor. A nova data criada será feita com 30 dias a partir da data atual. Para que ela considerasse
      a data fake, eu precisaria criar um método renew no orchetrator, o que não é necessário neste ponto do projeto. */
      jest.useRealTimers();
      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);
      const actualSession = await session.findOneValidByToken(
        sessionObject.token,
      );
      expect(actualSession.expires_at > sessionObject.expires_at).toBe(true);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithSessionInUse",
        email: createdUser.email,
        password: createdUser.password,
        features: [],
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });
    });
  });
});
