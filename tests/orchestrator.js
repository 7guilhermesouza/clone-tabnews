import retry from "async-retry";
import { faker } from "@faker-js/faker";
import { exec } from "node:child_process";
import fs from "node:fs/promises";
import database from "infra/database.js";
import migrator from "@/model/migrator.js";
import user from "@/model/user.js";
import session from "@/model/session.js";
import activation from "@/model/activation.js";
import email from "@/infra/email.js";
import { HTTP_EMAIL_URL } from "@/infra/email.js";
import { promisify } from "node:util";
import { resolve } from "node:path";

const execPromise = promisify(exec);

async function createFakeMigration() {
  try {
    await execPromise("npm run migrations:create Fake Migration");
  } catch (error) {
    console.error(`Erro ao executar o comando: ${error.message}`);
    throw error;
  }
}

async function deleteFakeMigration() {
  try {
    const migrationDir = resolve("infra", "migrations");
    const files = await fs.readdir(migrationDir);

    // Filtra arquivos que contêm "fake" e "migration" no nome (ignorando maiúsculas/minúsculas)
    const fakeFiles = files.filter((file) => {
      const lowerFile = file.toLowerCase();
      return lowerFile.includes("fake") && lowerFile.includes("migration");
    });

    // Remove cada um dos arquivos encontrados
    for (const file of fakeFiles) {
      const filePath = resolve(migrationDir, file);
      await fs.unlink(filePath);
    }
  } catch (error) {
    console.error(`Erro ao deletar as migrações fake: ${error.message}`);
    throw error;
  }
}

/** INFRA  */
async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    async function fetchToserver() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (response.status !== 200) {
        throw Error();
      }
    }
    return retry(fetchToserver, {
      retries: 100,
      maxTimeout: 1000,
      minTimeout: 100,
    });
  }
}

async function waitForEmailServer() {
  await email.emailServerIsReady();
}

async function cleanDatase() {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

/** USER */
async function createUser(userObject) {
  return await user.create({
    username:
      userObject?.username || faker.internet.username().replace(/[._-]/g, ""),
    email: userObject?.email || faker.internet.email(),
    // secretlint-disable-next-line @secretlint/secretlint-rule-pattern
    password: userObject?.password || "Senha@123",
  });
}

async function createActivatedUser(userObject) {
  let createdUser = await createUser(userObject);
  await activateUser(createdUser.id);
  createdUser = await user.findOneById(createdUser.id);

  return createdUser;
}

async function createLoggedUser(userObject) {
  let createdUser = await createActivatedUser(userObject);
  let userSession = await createSession(createdUser.id);
  createdUser = await user.findOneById(createdUser.id);
  createdUser = {
    ...createdUser,
    session: userSession,
  };
  return createdUser;
}

async function addFeaturesToUser(userObject, features) {
  const updatedUser = await user.addFeatures(userObject, features);
  return updatedUser;
}

async function deactivateUser(user) {
  const deactivatedUser = await activation.deactivate(user);
  return deactivatedUser;
}

/** SESSIONS */

async function createSession(userId) {
  return await session.create(userId);
}

/** ACTIVATIONS */
async function createActivationToken(userId) {
  const activationToken = await activation.create(userId);
  return activationToken;
}

async function activateUser(userId) {
  const activationToken = await activation.create(userId);
  const activatedToken = await activation.activate(activationToken.id);
  return activatedToken;
}

/** EMAILS */
async function getLastEmail() {
  const emailListResponse = await fetch(`${HTTP_EMAIL_URL}/messages`);
  const listEmail = await emailListResponse.json();
  const LastEmailItem = listEmail.pop();
  if (!LastEmailItem) {
    return null;
  }
  const lastEmailTextResponse = await fetch(
    `${HTTP_EMAIL_URL}/messages/${LastEmailItem.id}.plain`,
  );
  const lastEmailText = await lastEmailTextResponse.text();
  LastEmailItem.text = lastEmailText;

  return LastEmailItem;
}

async function deleteAllEmails() {
  await fetch(`${HTTP_EMAIL_URL}/messages`, {
    method: "DELETE",
  });
}

function FindActivationTokenInEmail(text) {
  const foundedToken = text.match("(ativar/)([a-zA-Z0-9-]+)");
  return foundedToken[2];
}

const orchestrator = {
  waitForAllServices,
  cleanDatase,
  runPendingMigrations,
  createFakeMigration,
  deleteFakeMigration,
  createUser,
  createActivatedUser,
  createLoggedUser,
  createActivationToken,
  activateUser,
  createSession,
  addFeaturesToUser,
  deleteAllEmails,
  getLastEmail,
  FindActivationTokenInEmail,
  deactivateUser,
};

export default orchestrator;
