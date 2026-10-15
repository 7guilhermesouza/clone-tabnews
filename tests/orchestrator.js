import retry from "async-retry";
import { faker } from "@faker-js/faker";
import database from "infra/database.js";
import migrator from "@/model/migrator.js";
import user from "@/model/user.js";
import session from "@/model/session.js";

const HTTP_EMAIL_URL = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

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

  async function waitForEmailServer() {
    async function fetchToEmailserver() {
      const response = await fetch(`${HTTP_EMAIL_URL}/messages`);

      if (response.status !== 200) {
        throw Error();
      }
    }
    return retry(fetchToEmailserver, {
      retries: 100,
      maxTimeout: 1000,
      minTimeout: 100,
    });
  }
}

async function cleanDatase() {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObject) {
  return await user.create({
    username:
      userObject?.username || faker.internet.username().replace(/[._-]/g, ""),
    email: userObject?.email || faker.internet.email(),
    // secretlint-disable-next-line @secretlint/secretlint-rule-pattern
    password: userObject?.password || "Senha@123",
  });
}
async function createSession(userId) {
  return await session.create(userId);
}

async function deleteAllEmails() {
  await fetch(`${HTTP_EMAIL_URL}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  const emailListResponse = await fetch(`${HTTP_EMAIL_URL}/messages`);
  const listEmail = await emailListResponse.json();
  const LastEmailItem = listEmail.pop();
  const lastEmailTextResponse = await fetch(
    `${HTTP_EMAIL_URL}/messages/${LastEmailItem.id}.plain`,
  );
  const lastEmailText = await lastEmailTextResponse.text();
  LastEmailItem.text = lastEmailText;

  return LastEmailItem;
}
const orchestrator = {
  waitForAllServices,
  cleanDatase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
};

export default orchestrator;
