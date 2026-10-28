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
  injectDefaultFeaturesInObject(userInputValues);

  const newUser = await runInsertUser(userInputValues);
  return newUser;

  async function runInsertUser(userInputValues) {
    const result = await database.query({
      text: `
      INSERT INTO
      users (username, email, password, features)
    VALUES
    ($1, $2, $3, $4)
    RETURNING
      *
    ;`,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
        userInputValues.features,
      ],
    });
    return result.rows[0];
  }

  function injectDefaultFeaturesInObject(userInputValues) {
    userInputValues.features = ["read:activation_token"];
  }
}

async function findOneById(id) {
  const foundUser = findOne(id);
  return foundUser;

  async function findOne(id) {
    const result = await database.query({
      text: `
      SELECT
        *
      FROM
        users
      WHERE
        id = $1
      LIMIT
        1;`,
      values: [id],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({});
    }

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

async function update(userObject) {
  let currentUser;
  if ("id" in userObject) {
    currentUser = await findOneById(userObject.id);
  } else if ("username" in userObject) {
    currentUser = await findOneByUsername(userObject.username);
  }

  const userInput = userObject.values;

  if ("username" in userInput) {
    if (
      userObject.username.toLowerCase() !== userInput.username.toLowerCase()
    ) {
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
          features = $5,
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
        userInputValues.features,
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

async function addFeatures(userObject, features) {
  const currentUser = await findOneById(userObject.id);
  const updatedUser = await runUpdateQuery(currentUser.id, features);

  return updatedUser;

  async function runUpdateQuery(userId, features) {
    const result = await database.query({
      text: `
        UPDATE
          users
        SET
          features = array_cat(features, $2),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *;`,
      values: [userId, features],
    });

    return result.rows[0];
  }
}
const user = {
  create,
  findOneById,
  findOneByUsername,
  findOneByEmail,
  update,
  addFeatures,
};

export default user;
