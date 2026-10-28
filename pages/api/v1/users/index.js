import { createRouter } from "next-connect";
import controllers from "@/infra/controllers.js";
import user from "@/model/user.js";
import activation from "@/model/activation.js";
import authorization from "@/model/authorization";

const router = createRouter();
router.use(controllers.injectUser);
router.post(controllers.canRequest("create:user"), postHandler);
export default router.handler(controllers.handlers);

async function postHandler(request, response) {
  const userInputValues = request.body;
  const newUser = await user.create(userInputValues);
  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  const secureOutput = authorization.filterOutput(
    newUser,
    "read:user",
    newUser,
  );
  return response.status(201).json(secureOutput);
}
