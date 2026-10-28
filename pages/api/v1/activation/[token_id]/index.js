import { createRouter } from "next-connect";
import controller from "@/infra/controllers.js";
import activation from "@/model/activation.js";
import authorization from "@/model/authorization";

const router = createRouter();
router.use(controller.injectUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);
export default router.handler(controller.handlers);

async function patchHandler(request, response) {
  const tokenId = request.query.token_id;
  const userRequester = request.context.user;
  const activatedToken = await activation.activate(tokenId);

  const secureOutput = authorization.filterOutput(
    userRequester,
    "read:activation_token",
    activatedToken,
  );
  return response.status(200).json(secureOutput);
}
