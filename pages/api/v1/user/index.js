import { createRouter } from "next-connect";
import controller from "@/infra/controllers.js";
import session from "@/model/session.js";
import { UnauthorizedError } from "@/infra/errors.js";
import authorization from "@/model/authorization.js";
//import user from "@/model/user.js";

const router = createRouter();
router.use(controller.injectUser);
router.get(controller.canRequest("read:user"), getHandler);
export default router.handler(controller.handlers);

async function getHandler(request, response) {
  const { session: foundSession, ...foundUser } = request.context.user;
  if (!foundSession) {
    throw new UnauthorizedError({});
  }
  const renewdSession = await session.renew(foundSession.id);
  controller.setSessionCookie(renewdSession.token, response);

  const secureOutput = authorization.filterOutput(
    foundUser,
    "read:user:self",
    foundUser,
  );

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return response.status(200).json(secureOutput);
}
