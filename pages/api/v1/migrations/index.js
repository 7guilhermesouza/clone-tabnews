import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "@/infra/database.js";
import { createRouter } from "next-connect";
import controllers from "@/infra/controllers.js";

const router = createRouter();
router.get(getHandler);
router.post(postHandler);
export default router.handler(controllers.handlers);

async function migrationHandler(dryRun = true) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const defaultMigrationsOptions = {
      dbClient: dbClient,
      dryRun: dryRun,
      dir: resolve("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };
    const migrations = await migrationRunner(defaultMigrationsOptions);

    return migrations;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient?.end();
  }
}
async function getHandler(request, response) {
  const pendingMigrations = await migrationHandler();
  return response.status(200).json(pendingMigrations);
}

async function postHandler(request, response) {
  const migratedMigrations = await migrationHandler(false);

  if (migratedMigrations.length > 0) {
    return response.status(201).json(migratedMigrations);
  }

  return response.status(200).json(migratedMigrations);
}
