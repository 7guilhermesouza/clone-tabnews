import crypto from "node:crypto";
import database from "@/infra/database.js";
import { NotFoundError, UnauthorizedError } from "@/infra/errors";

const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 24 * 30 * 1000;

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const newSession = await runInserQuery(token, userId, expiresAt);
  return newSession;

  async function runInserQuery(token, userId, expiresAt) {
    const result = await database.query({
      text: `
        INSERT INTO
          sessions (token, user_id, expires_at)
        VALUES
          ($1, $2, $3)
        RETURNING
          *`,
      values: [token, userId, expiresAt],
    });

    return result.rows[0];
  }
}

async function findOneValidByToken(token) {
  const foundToken = await findOne(token);
  return foundToken;

  async function findOne(token) {
    const result = await database.query({
      text: `
        SELECT
          *
        FROM
          sessions
        WHERE
          token = $1 AND expires_at > NOW()
        LIMIT 1`,
      values: [token],
    });
    if (result.rowCount === 0) {
      throw new UnauthorizedError({});
    }
    return result.rows[0];
  }
}

async function renew(sessionId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const updatedSession = await updateQuery(sessionId, expiresAt);
  return updatedSession;

  async function updateQuery(sessionId, expiresAt) {
    const result = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = $2,
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING
          *
          ;`,
      values: [sessionId, expiresAt],
    });
    if (result.rowCount === 0) {
      throw new NotFoundError({});
    }

    return result.rows[0];
  }
}

async function expireById(sessionId) {
  const expiredSession = await updateSesionQuery(sessionId);
  return expiredSession;

  async function updateSesionQuery(sessionId) {
    const result = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = expires_at - interval '1 year',
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [sessionId],
    });
    if (result.rowCount === 0) {
      throw new UnauthorizedError({});
    }

    return result.rows[0];
  }
}

async function expireByToken(sessionToken) {
  const expiredSession = await updateSesionQuery(sessionToken);
  return expiredSession;

  async function updateSesionQuery(sessionToken) {
    const result = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = expires_at - interval '1 year',
          updated_at = NOW()
        WHERE
          token = $1
        RETURNING
          *
        ;`,
      values: [sessionToken],
    });
    if (result.rowCount === 0) {
      throw new UnauthorizedError({});
    }

    return result.rows[0];
  }
}

const session = {
  EXPIRATION_IN_MILLISECONDS,
  create,
  findOneValidByToken,
  renew,
  expireById,
  expireByToken,
};

export default session;
