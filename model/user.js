/* secretlint-disable -- as senhas não são exposta aqui, apenas tratadas e criadas o hash. */
import database from "@/infra/database.js";
import { ValidationError, NotFoundError } from "@/infra/errors";
import password from "@/model/password.js";

async function validateUniqueUsername(username) {
  const result = await database.query({
    text: `
      SELECT
        username
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)`,
    values: [username],
  });

  if (result.rowCount > 0) {
    throw new ValidationError({});
  }
}

async function validateUniqueEmail(email) {
  const result = await database.query({
    text: `
      SELECT
        email
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)`,
    values: [email],
  });

  if (result.rowCount > 0) {
    throw new ValidationError({});
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

async function create(userInputValues) {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);
  const newUser = await runInsertUser(userInputValues);
  return newUser;

  async function runInsertUser(userInputValues) {
    const result = await database.query({
      text: `
      INSERT INTO
      users (username, email, password)
    VALUES
    ($1, $2, $3)
    RETURNING
      *
    ;`,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });
    return result.rows[0];
  }
}

async function findOneByUsername(username) {
  const foundUser = await findOne(username);
  return foundUser;

  async function findOne(username) {
    const result = await database.query({
      text: `
      SELECT
        *
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT
        1`,
      values: [username],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({});
    }

    return result.rows[0];
  }
}

async function update(username, userInput) {
  const currentUser = await findOneByUsername(username);

  if ("username" in userInput) {
    if (username.toLowerCase() !== userInput.username.toLowerCase()) {
      await validateUniqueUsername(userInput.username);
    }
  }

  if ("email" in userInput) {
    await validateUniqueEmail(userInput.email);
  }

  if ("password" in userInput) {
    await hashPasswordInObject(userInput);
  }

  const userWithNewValues = { ...currentUser, ...userInput };
  const updatedUser = await runUpdateQuery(userWithNewValues);
  return updatedUser;

  async function runUpdateQuery(userInputValues) {
    const result = await database.query({
      text: `
        UPDATE
          users
        SET
          username = $2,
          email = $3,
          password = $4,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *;`,
      values: [
        userInputValues.id,
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });

    return result.rows[0];
  }
}

async function findOneByEmail(email) {
  const foundUser = await findOne(email);
  return foundUser;

  async function findOne(email) {
    const result = await database.query({
      text: `
      SELECT
        *
      FROM
        users
      WHERE
        email = $1;`,
      values: [email],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({});
    }

    return result.rows[0];
  }
}

const user = {
  create,
  findOneByUsername,
  findOneByEmail,
  update,
};

export default user;
