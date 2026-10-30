import { Client } from "pg";
import { ServiceError } from "@/infra/errors.js";

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }

  return process.env.NODE_ENV == "production" ? true : false;
}

async function getNewClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSSLValues(),
  });
  await client.connect();
  return client;
}
async function query(queryObject) {
  let client;
  try {
    client = await getNewClient();
    const result = await client.query(queryObject);
    return result;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      cause: error,
      message: "Erro de conexão ou de consulta ao banco de dados.",
    });
    throw serviceErrorObject;
  } finally {
    await client?.end();
  }
}

async function databaseIsReady() {
  const query = await database.query("SELECT 1 AS status;");
  if (query.rows[0].status) {
    return true;
  } else {
    return false;
  }
}

async function checkStatus() {
  const version = await database.query("SHOW server_version;");
  const maxConnections = await database.query("SHOW max_connections;");
  const databaseName = process.env.POSTGRES_DB;
  const openedConnections = await database.query({
    text: "SELECT count(*)::int from pg_stat_activity where datname = $1;",
    values: [databaseName],
  });
  return {
    version: version.rows[0].server_version,
    max_connections: Number(maxConnections.rows[0].max_connections),
    opened_connections: openedConnections.rows[0].count,
  };
}

const status = {
  isReady: databaseIsReady,
  check: checkStatus,
};

const database = { query, getNewClient, status };
export default database;
