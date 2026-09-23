const { spawn, spawnSync } = require("node:child_process");

// Mantem o comando dev principal fácil de gerenciar e controlar e centralizado no package.json
spawn("npm", ["run", "dev:start"], {
  stdio: "inherit",
  shell: true,
});

function stopServices() {
  // Executa o comando npm run services:stop de forma multiplataforma
  spawnSync("npm", ["run", "services:stop"], { stdio: "inherit", shell: true });
  process.exit(0);
}

// Garante que os serviços parem se o usuário apertar Ctrl+C (SIGINT)
process.on("SIGINT", () => {
  stopServices();
});
