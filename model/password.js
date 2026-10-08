/* secretlint-disable -- as senhas não são exposta aqui, apenas tratadas e criadas o hash. */
import { InternalServerError } from "@/infra/errors";
import bcryptjs from "bcryptjs";

function getNumberOfRounds() {
  return process.env.NODE_ENV == "production" ? 14 : 1;
}
async function hash(password) {
  const rounds = getNumberOfRounds();
  const passwordWithPepper = addPepper(password);
  return await bcryptjs.hash(passwordWithPepper, rounds);
}

function addPepper(password) {
  try {
    const pepper = process.env.PASSWORD_PEPPER;
    const [start, end] = pepper.split("-");
    if (!start || !end) {
      throw new InternalServerError({
        cause: "Pepper is not defined.",
      });
    }
    return start + password + end;
  } catch (error) {
    throw new InternalServerError({
      cause: "Pepper is not defined.",
    });
  }
}

async function compare(password, hashedPassword) {
  const passwordWithPepper = addPepper(password);
  const passwordMatch = await bcryptjs.compare(
    passwordWithPepper,
    hashedPassword,
  );
  return passwordMatch;
}

const password = {
  hash,
  compare,
};

export default password;
