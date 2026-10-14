import { createRouter } from "next-connect";
import controllers from "@/infra/controllers.js";
import authentication from "@/model/authentication.js";
import session from "@/model/session.js";
import controller from "@/infra/controllers.js";

const router = createRouter();
router.post(postHandler);
router.delete(deleteHandler);
export default router.handler(controllers.handlers);

async function postHandler(request, response) {
  const userInputValues = request.body;
  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );
  const newSession = await session.create(authenticatedUser.id);
  controllers.setSessionCookie(newSession.token, response);

  return response.status(201).json(newSession);
}

async function deleteHandler(request, response) {
  const receivedToken = request.cookies.session_id;
  const foundedSession = await session.findOneValidByToken(receivedToken);
  const expiredSession = await session.expireById(foundedSession.id);
  controller.clearSessionCookie(response);

  return response.status(200).json(expiredSession);
}
