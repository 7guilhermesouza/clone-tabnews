import email from "@/infra/email.js";
import database from "@/infra/database.js";
import webserver from "@/infra/webserver.js";
import { NotFoundError } from "@/infra/errors";
import user from "@/model/user.js";
import authorization from "./authorization";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; //15 minutes

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "no-reply@exemplo.com",
    to: user.email,
    subject: "Ative sua conta no sistema",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no sistema.\n\n${webserver.origin}/cadastro/ativar/${activationToken.id}\n\nAtenciosamente,\nEquipe do sistema`,
  });
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const activation_token = runInsertQuery(userId, expiresAt);
  return activation_token;

  async function runInsertQuery(userId, expiresAt) {
    const result = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens ( user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
        ;`,
      values: [userId, expiresAt],
    });

    return result.rows[0];
  }
}
async function findOneValidByActivationToken(token) {
  const result = await runSelectQuery(token);
  return result;

  async function runSelectQuery(token) {
    const result = await database.query({
      text: `
      SELECT
      *
      FROM
      user_activation_tokens
      WHERE
      id = $1 AND expires_at > NOW() AND used_at IS NULL
      LIMIT 1
      ;`,
      values: [token],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({});
    }

    return result.rows[0];
  }
}

async function activate(tokenId) {
  const receivedToken = await findOneValidByActivationToken(tokenId);
  const foundUser = await user.findOneById(receivedToken.user_id);
  authorization.can(foundUser, "read:activation_token", receivedToken);

  const usedToken = await useActivationToken(tokenId); // eslint-disable-line react-hooks/rules-of-hooks
  await user.update({
    id: usedToken.user_id,
    values: {
      features: [
        "read:status",
        "create:session",
        "delete:session",
        "read:user",
        "update:user",
      ],
    },
  });

  return usedToken;

  async function useActivationToken(tokenId) {
    const result = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
          ;`,
      values: [tokenId],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({});
    }

    return result.rows[0];
  }
}

async function deactivate(userObject) {
  const deactivatedUser = await user.update({
    id: userObject.id,
    values: {
      features: [],
    },
  });
  return deactivatedUser;
}

const activation = {
  create,
  sendEmailToUser,
  findOneValidByActivationToken,
  activate,
  deactivate,
};

export default activation;
