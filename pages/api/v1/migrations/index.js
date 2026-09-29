import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "@/infra/database.js";
import { createRouter } from "next-connect";
import { InternalServerError, MethodNotAllowedError } from "@/infra/errors";

const router = createRouter();
router.get(getHandler);
router.post(postHandler);
export default router.handler({
  onError: onErrorHandler,
  onNoMatch: onNoMatchHandler,
});

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  console.error(publicErrorObject);
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({ cause: error });
  console.log("\n Erro dentro do catch do controller:");
  console.error(publicErrorObject);
  response.status(500).json(publicErrorObject);
}

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
