import { NotFoundError, UnauthorizedError } from "@/infra/errors.js";
import user from "@/model/user.js";
import password from "@/model/password.js";
import authorization from "./authorization.js";

async function getAuthenticatedUser(providedEmail, providedPassword) {
  try {
    const foundUser = await validateEmail(providedEmail);
    authorization.can(foundUser, "create:session");
    await validatePassword(providedPassword, foundUser.password);

    return foundUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({});
    }
    throw error;
  }

  async function validateEmail(email) {
    let foundUser;
    try {
      foundUser = await user.findOneByEmail(email);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({ cause: "Email not found." });
      }
      throw error;
    }
    return foundUser;
  }

  async function validatePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword,
    );
    if (!correctPasswordMatch) {
      throw new UnauthorizedError({ cause: "Password dont match." });
    }
    return correctPasswordMatch;
  }
}

const auth = {
  getAuthenticatedUser,
};

export default auth;
