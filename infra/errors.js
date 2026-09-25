export class InternalServerError extends Error {
  constructor({ cause }) {
    super("Ocorreu um erro interno não esperado.", {
      cause,
    });
    this.name = "InternalServerError";
    this.action = "Por favor, entre em contato com o suporte.";
    this.statusCode = 500;
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
