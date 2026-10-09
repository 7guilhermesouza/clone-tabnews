import { createRouter } from "next-connect";
import controllers from "@/infra/controllers.js";
import user from "@/model/user.js";

const router = createRouter();
router.get(getHandler);
router.patch(patchHandler);
export default router.handler(controllers.handlers);

async function getHandler(request, response) {
  const username = request.query.username;
  const foundUser = await user.findOneByUsername(username);
  return response.status(200).json(foundUser);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInput = request.body;
  const updatedUser = await user.update(username, userInput);
  return response.status(200).json(updatedUser);
}
