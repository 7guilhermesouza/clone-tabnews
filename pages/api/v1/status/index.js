import database from "infra/database/database.js";

export default async function status(request, response) {
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
