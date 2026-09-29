import database from "@/infra/database.js";
import { InternalServerError, MethodNotAllowedError } from "@/infra/errors";
import { createRouter } from "next-connect";

const router = createRouter();
router.get(getHandler);
export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
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

async function getHandler(request, response) {
  const updatedAt = new Date().toISOString();
  const version = await database.query("SHOW server_version;");
  const maxConnections = await database.query("SHOW max_connections;");
  const databaseName = process.env.POSTGRES_DB;
  const openedConnections = await database.query({
    text: "SELECT count(*)::int from pg_stat_activity where datname = $1;",
    values: [databaseName],
  });
  return response.status(200).json({
    update_at: updatedAt,
    dependencies: {
      database: {
        version: version.rows[0].server_version,
        max_connections: Number(maxConnections.rows[0].max_connections),
        opened_connections: openedConnections.rows[0].count,
      },
    },
  });
}
