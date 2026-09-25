import useSWR from "swr";

async function fetchStatus(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}
function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchStatus, {
    //refreshInterval: 2000,
  });

  let updatedAtText = "Carregando ...";
  if (!isLoading && data) {
    updatedAtText = new Date(data.update_at).toLocaleString("pt-BR");
  }

  return <div>Última atualização em: {updatedAtText}</div>;
}

function DatabaseStatus() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchStatus, {
    //refreshInterval: 2000,
  });
  let version, max_connections, opened_connections;
  if (!isLoading && data) {
    const db = data.dependencies.database;
    version = db.version;
    max_connections = db.max_connections;
    opened_connections = db.opened_connections;
  }

  return (
    <>
      <h2>Status do banco de dados:</h2>
      <p>Versão atual do banco de dados: {version}</p>
      <p>
        Número máximo de conexões simultâneas permitidas no banco de dados:{" "}
        {max_connections}
      </p>
      <p>
        Conexões abertas com o banco de dados neste mmomento:{" "}
        {opened_connections}
      </p>
    </>
  );
}

export default function StatusPage() {
  return (
    <>
      <h1>Status dos serviços</h1>
      <UpdatedAt />
      <DatabaseStatus />
    </>
  );
}
