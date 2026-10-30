import * as cookie from "cookie";
import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
} from "@/infra/errors.js";
import session from "@/model/session.js";
import user from "@/model/user.js";
import authorization from "@/model/authorization.js";

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  return response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    return response.status(error.statusCode).json(error);
  }
  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response);
    return response.status(error.statusCode).json(error);
  }
  const publicErrorObject = new InternalServerError({
    cause: error,
    statusCode: error.statusCode,
  });
  console.error(publicErrorObject);
  return response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function setSessionCookie(sessionToken, response) {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  response.setHeader("Set-Cookie", setCookie);
}

async function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  response.setHeader("Set-Cookie", setCookie);
}

async function retryLogAndInjectUser(error, request) {
  if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
    const email = request.body?.email;
    const password = request.body?.password;
    if (
      email &&
      password &&
      request.method === "POST" &&
      request.url === "/api/v1/sessions"
    ) {
      injectAnonymousUser();
    } else {
      throw error;
    }
  }
}

async function injectAuthenticatedUser(request) {
  const sessionToken = request.cookies.session_id;
  try {
    const validSession = await session.findOneValidByToken(sessionToken);
    const authenticatedUser = await user.findOneById(validSession.user_id);
    request.context = {
      ...request.context,
      user: { ...authenticatedUser, session: validSession },
    };
  } catch (error) {
    await retryLogAndInjectUser(error, request);
  }
}

function injectAnonymousUser(request) {
  request.context = {
    ...request.context,
    user: {
      features: [
        "read:status",
        "read:user",
        "create:user",
        "read:activation_token",
        "create:session",
      ],
    },
  };
}

async function injectUser(request, response, next) {
  if (request.cookies?.session_id) {
    await injectAuthenticatedUser(request);
  } else {
    injectAnonymousUser(request);
  }
  return next();
}

function canRequest(feature) {
  return function CanRequestMiddleware(request, response, next) {
    const userTryingToRequest = request.context.user;

    authorization.can(userTryingToRequest, feature);

    return next();
  };
}

function onlyAuthenticatedUsersCanAccess(request, response, next) {
  const userTryingToRequest = request.context.user;
  if ("id" in userTryingToRequest) {
    return next();
  }
  throw new UnauthorizedError({});
}

const controller = {
  handlers: {
    onError: onErrorHandler,
    onNoMatch: onNoMatchHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectUser,
  canRequest,
  onlyAuthenticatedUsersCanAccess,
};

export default controller;
