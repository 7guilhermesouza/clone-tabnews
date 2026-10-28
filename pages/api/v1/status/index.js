import { createRouter } from "next-connect";
import database from "@/infra/database.js";
import controllers from "@/infra/controllers.js";
import authorization from "@/model/authorization.js";
import email from "@/infra/email.js";

const router = createRouter();
router.use(controllers.injectUser);
router.get(controllers.canRequest("read:status"), getHandler);
export default router.handler(controllers.handlers);

async function getHandler(request, response) {
  const userRequester = request.context.user;
  const { can: readAllStatus } = await authorization.can(
    userRequester,
    "read:status:all",
    null,
    "return",
  );
  const updatedAt = new Date().toISOString();
  if (readAllStatus) {
    return response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: await database.status.check(),
        email: await email.emailServerIsReady(),
      },
    });
  } else {
    return response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: await database.status.isReady(),
        email: await email.emailServerIsReady(),
      },
    });
  }
}
