import { createRouter } from "next-connect";
import controllers from "@/infra/controllers.js";
import authentication from "@/model/authentication.js";
import session from "@/model/session.js";
import controller from "@/infra/controllers.js";
import authorization from "@/model/authorization.js";
import { UnauthorizedError } from "@/infra/errors";

const router = createRouter();
router.use(controllers.injectUser);
router.post(controllers.canRequest("create:session"), postHandler);
router.delete(controllers.canRequest("delete:session"), deleteHandler);
export default router.handler(controllers.handlers);

async function postHandler(request, response) {
  const userInputValues = request.body;
  const { session: currentSession } = request.context.user;

  if (currentSession) {
    throw new UnauthorizedError({
      message:
        "Você já está logado, acesse o sistema ou faça logout antes de tentar efetuar novo login.",
    });
  }

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );
  const newSession = await session.create(authenticatedUser.id);

  const secureOutput = authorization.filterOutput(
    authenticatedUser,
    "read:session",
    newSession,
  );

  controllers.setSessionCookie(newSession.token, response);
  return response.status(201).json(secureOutput);
}

async function deleteHandler(request, response) {
  const receivedToken = request.cookies.session_id;
  const userRequester = request.context.user;
  const foundedSession = await session.findOneValidByToken(receivedToken);
  const expiredSession = await session.expireById(foundedSession.id);

  controller.clearSessionCookie(response);
  const secureOutput = authorization.filterOutput(
    userRequester,
    "delete:session",
    expiredSession,
  );

  return response.status(200).json(secureOutput);
}
