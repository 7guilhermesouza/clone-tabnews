import retry from "async-retry";
import { faker } from "@faker-js/faker";
import database from "infra/database.js";
import migrator from "@/model/migrator";
import user from "@/model/user.js";

async function waitForAllServices() {
  await waitForWebServer();

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

const orchestrator = {
  waitForAllServices,
  cleanDatase,
  runPendingMigrations,
  createUser,
};

export default orchestrator;
