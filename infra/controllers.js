import { InternalServerError, MethodNotAllowedError } from "@/infra/errors";

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  console.error(publicErrorObject);
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({ cause: error });
  console.log("\n Erro dentro do catch do controller:");
  console.error(publicErrorObject);
  response.status(500).json(publicErrorObject);
}

export default {
  handlers: {
    onError: onErrorHandler,
    onNoMatch: onNoMatchHandler,
  },
};
