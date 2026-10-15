import { describe, test, expect, beforeAll } from "@jest/globals";
import email from "@/infra/email.js";
import orchestrator from "@/tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "TabNews <contato@exemplo.com>",
      to: "financeiro@exemplo.com",
      subject: "Teste de assunto",
      text: "Este é o corpo do email enviado.",
    });

    await email.send({
      from: "TabNews <contato@exemplo.com>",
      to: "financeiro@exemplo.com",
      subject: "Segundo email",
      text: "Este é o corpo do segundo email enviado.",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<contato@exemplo.com>");
    expect(lastEmail.recipients[0]).toBe("<financeiro@exemplo.com>");
    expect(lastEmail.subject).toBe("Segundo email");
    expect(lastEmail.text).toBe("Este é o corpo do segundo email enviado.\r\n");
  });

  test("Clear inbox", async () => {});
});
