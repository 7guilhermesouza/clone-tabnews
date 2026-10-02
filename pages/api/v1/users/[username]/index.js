import { createRouter } from "next-connect";
import controllers from "@/infra/controllers.js";
import user from "@/model/user.js";

const router = createRouter();
router.get(getHandler);
export default router.handler(controllers.handlers);

async function getHandler(request, response) {
  const username = request.query.username;
  const foundUser = await user.findOneByUsername(username);
  return response.status(200).json(foundUser);
}
