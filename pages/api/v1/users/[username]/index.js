import { createRouter } from "next-connect";
import controllers from "@/infra/controllers.js";
import user from "@/model/user.js";
import authorization from "@/model/authorization.js";

const router = createRouter();
router.use(controllers.injectUser);
router.get(controllers.canRequest("read:user"), getHandler);
router.patch(controllers.canRequest("update:user"), patchHandler);
export default router.handler(controllers.handlers);

async function getHandler(request, response) {
  const username = request.query.username;
  const userRequester = request.context.user;
  const targetUser = await user.findOneByUsername(username);
  const secureOutput = authorization.filterOutput(
    userRequester,
    "read:user",
    targetUser,
  );

  return response.status(200).json(secureOutput);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInput = request.body;
  const userRequester = request.context.user;

  const targetUser = await user.findOneByUsername(username);
  authorization.can(userRequester, "update:user", targetUser);

  const updatedUser = await user.update({ username, values: userInput });

  const secureOutput = authorization.filterOutput(
    userRequester,
    "read:user",
    updatedUser,
  );
  return response.status(200).json(secureOutput);
}
