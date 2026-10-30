import { createRouter } from "next-connect";
import controllers from "@/infra/controllers.js";
import migrator from "@/model/migrator.js";
import authorization from "@/model/authorization";

async function getHandler(request, response) {
  const userRequester = request.context.user;
  const pendingMigrations = await migrator.listPendingMigrations();
  const filterOutput = authorization.filterOutput(
    userRequester,
    "read:migrations",
    pendingMigrations,
  );
  return response.status(200).json(filterOutput);
}

async function postHandler(request, response) {
  const userRequester = request.context.user;

  const migratedMigrations = await migrator.runPendingMigrations();
  const filterOutput = authorization.filterOutput(
    userRequester,
    "create:migrations",
    migratedMigrations,
  );

  return response
    .status(migratedMigrations.length > 0 ? 201 : 200)
    .json(filterOutput);
}

const router = createRouter();
router.use(controllers.injectUser);
router.get(controllers.canRequest("read:migrations"), getHandler);
router.post(controllers.canRequest("create:migrations"), postHandler);
export default router.handler(controllers.handlers);
