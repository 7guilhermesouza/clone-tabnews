import retry from "async-retry";
import database from "infra/database.js";
import migrator from "@/model/migrator";

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

const orchestrator = {
  waitForAllServices,
  cleanDatase,
  runPendingMigrations,
};

export default orchestrator;
