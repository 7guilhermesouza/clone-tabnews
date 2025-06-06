import database from "infra/database.js";

async function status(request, response) {
  // Objetivo 1: Implementar a data de atualização da mensagem o update_ai na api.
  // Objetivo 2: Retornar a versão do postgress
  // objetivo 3: Retornar o número de conexões máximas
  // objetivo 4: retornar o número de conexões usadas no momento.

  const updatedAt = new Date().toISOString();

  const databaseVersionResult = await database.query("SHOW SERVER_VERSION;");
  const databaseVersionValue = databaseVersionResult.rows[0].server_version;

  const databaseMCR = await database.query("SHOW MAX_CONNECTIONS;");
  const databaseMaxConnectionsValue = databaseMCR.rows[0].max_connections;

  const datname = process.env.POSTGRES_DB;

  const databaseOpenedConnectionsResult = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname= $1;",
    values: [datname],
  });

  const databaseOpenedConnectionsValue =
    databaseOpenedConnectionsResult.rows[0].count;

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersionValue,
        max_connections: parseInt(databaseMaxConnectionsValue),
        opened_connections: databaseOpenedConnectionsValue,
      },
    },
  });
}

export default status;
