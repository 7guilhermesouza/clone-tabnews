import { createRouter } from "next-connect";
import controllers from "@/infra/controllers.js";
import migrator from "@/model/migrator.js";

const router = createRouter();
router.get(getHandler);
router.post(postHandler);
export default router.handler(controllers.handlers);

async function getHandler(request, response) {
  const pendingMigrations = await migrator.listPendingMigrations();
  return response.status(200).json(pendingMigrations);
}

async function postHandler(request, response) {
  const migratedMigrations = await migrator.runPendingMigrations();
  return response
    .status(migratedMigrations.length > 0 ? 201 : 200)
    .json(migratedMigrations);
}
