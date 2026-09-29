export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("Ocorreu um erro interno não esperado.", {
      cause,
    });
    this.name = "InternalServerError";
    this.action = "Por favor, entre em contato com o suporte.";
    this.statusCode = statusCode || 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Method not allowed.");
    this.name = "MethodNotAllowedError";
    this.action =
      "Verifique na documentação os métodos permitidos para esta rota.";
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ServiceError extends Error {
  constructor({ cause, message }) {
    super(message || "Service unavailable.", { cause });
    this.name = "ServiceError";
    this.action =
      "Verifique se o serviço está disponível e funcionando normalmente.";
    this.statusCode = 503;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
