import { createRouter } from "next-connect";
import controller from "@/infra/controllers.js";
import session from "@/model/session.js";
import user from "@/model/user.js";

const router = createRouter();
router.get(getHandler);
export default router.handler(controller.handlers);

async function getHandler(request, response) {
  const receivedToken = request.cookies.session_id;
  const foundSession = await session.findOneValidByToken(receivedToken);
  const foundUser = await user.findOneById(foundSession.user_id);
  const renewdSession = await session.renew(foundSession.id);
  controller.setSessionCookie(renewdSession.token, response);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return response.status(200).json(foundUser);
}
