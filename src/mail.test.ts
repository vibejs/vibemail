import { JsonLogger, Module } from "@usevibejs/server";
import { VibeFactory } from "@usevibejs/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { consoleDriver } from "./console.ts";
import {
  MAIL_CONSOLE_IN_PRODUCTION,
  MAIL_INVALID_CONFIG,
  MAIL_INVALID_MESSAGE,
  MAIL_SEND_FAILED,
  MailError,
} from "./errors.ts";
import { Mailer } from "./mailer.ts";
import { MAILER, MailModule } from "./module.ts";
import { renderTemplate, validateMessage, type MailDriver, type MailMessage } from "./message.ts";
import { resendDriver } from "./resend.ts";
import { messageFrom } from "./index.ts";

const welcome = (name: string) => ({
  subject: `Hello ${name}`,
  text: `Hi ${name}`,
});

const sample: MailMessage = {
  from: "app@example.com",
  to: ["a@example.com"],
  subject: "Hello",
  text: "Hi",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("templates", () => {
  it("calls a plain function and accepts one recipient or many", () => {
    expect(
      renderTemplate(welcome, "Ada", {
        from: "app@example.com",
        to: "ada@example.com",
        replyTo: " ops@example.com ",
      }),
    ).toMatchObject({
      from: "app@example.com",
      to: ["ada@example.com"],
      replyTo: "ops@example.com",
      subject: "Hello Ada",
      text: "Hi Ada",
    });
    expect(
      messageFrom(
        { subject: "S", html: "<b>Hi</b>" },
        { from: "app@example.com", to: ["a@example.com"] },
      ).html,
    ).toBe("<b>Hi</b>");
  });

  it("rejects an incomplete message", () => {
    expect(() => validateMessage({ ...sample, from: "  " })).toThrow(
      expect.objectContaining({ code: MAIL_INVALID_MESSAGE }),
    );
    expect(() => validateMessage({ ...sample, to: ["  "] })).toThrow(/recipient/);
    expect(() => validateMessage({ ...sample, subject: " " })).toThrow(/subject/);
    expect(() => validateMessage({ from: sample.from, to: sample.to, subject: "Hello" })).toThrow(
      /text or html/,
    );
    expect(() => validateMessage({ ...sample, text: "  ", html: " " })).toThrow(/text or html/);
    expect(validateMessage({ ...sample, replyTo: "  " }).replyTo).toBeUndefined();
    expect(new MailError(MAIL_INVALID_MESSAGE, "bad").name).toBe("MailError");
  });
});

describe("consoleDriver", () => {
  it("logs the message and warns on every production send", async () => {
    const log = vi.fn<(line: string) => void>();
    const warn = vi.fn<(line: string) => void>();
    const quiet = consoleDriver({ env: "test", log, warn });
    await quiet.send(sample);
    expect(warn).not.toHaveBeenCalled();
    const loud = consoleDriver({ env: "production", log, warn });
    await loud.send(sample);
    await loud.send(sample);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0]?.[0]).toContain(MAIL_CONSOLE_IN_PRODUCTION);
  });

  it("uses console and NODE_ENV when no options are passed", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const sent = await consoleDriver().send(sample);
    expect(sent.id).toEqual(expect.any(String));
    expect(console.warn).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalled();
  });
});

function callsOf(mock: { mock: { calls: readonly unknown[] } }): readonly unknown[][] {
  return mock.mock.calls as readonly unknown[][];
}

describe("resendDriver", () => {
  it("posts the message and reads the id", async () => {
    const fetchImpl = vi.fn<() => Promise<Response>>(async () => Response.json({ id: "em_1" }));
    const driver = resendDriver({
      apiKey: "re_test",
      fetch: fetchImpl,
      baseUrl: "https://mail.test",
    });
    expect(await driver.send({ ...sample, html: "Hi there", replyTo: "ops@example.com" })).toEqual({
      id: "em_1",
    });
    const first = callsOf(fetchImpl)[0] ?? [];
    expect(first[0]).toBe("https://mail.test/emails");
    const init = first[1] as RequestInit;
    expect(init.headers).toMatchObject({ authorization: "Bearer re_test" });
    expect(JSON.parse(String(init.body))).toMatchObject({
      html: "Hi there",
      reply_to: "ops@example.com",
      text: "Hi",
    });
    fetchImpl.mockResolvedValueOnce(Response.json({ id: "em_2" }));
    expect(await driver.send({ ...sample, text: undefined, html: "Only" })).toEqual({ id: "em_2" });
  });

  it("uses the default endpoint and rejects a bad response", async () => {
    const fetchImpl = vi.fn<() => Promise<Response>>(async () =>
      Response.json({ id: "em_default" }),
    );
    vi.stubGlobal("fetch", fetchImpl);
    const driver = resendDriver({ apiKey: "re_test" });
    expect(await driver.send(sample)).toEqual({ id: "em_default" });
    expect(String(callsOf(fetchImpl)[0]?.[0])).toBe("https://api.resend.com/emails");
    fetchImpl.mockResolvedValueOnce(new Response("no", { status: 422 }));
    await expect(driver.send(sample)).rejects.toMatchObject({ code: MAIL_SEND_FAILED });
    for (const body of [null, "nope", { id: 1 }, { id: "" }, {}]) {
      fetchImpl.mockResolvedValueOnce(Response.json(body));
      await expect(driver.send(sample)).rejects.toMatchObject({ code: MAIL_SEND_FAILED });
    }
    expect(() => resendDriver({ apiKey: "  " })).toThrow(
      expect.objectContaining({ code: MAIL_INVALID_CONFIG }),
    );
  });
});

describe("Mailer", () => {
  it("fills from, renders, and sends through the module", async () => {
    const sent: MailMessage[] = [];
    const driver: MailDriver = {
      async send(message) {
        sent.push(message);
        return { id: "local-1" };
      },
    };
    const bare = new Mailer(driver);
    await expect(
      bare.send({ to: "ada@example.com", subject: "Hello", text: "Hi" }),
    ).rejects.toMatchObject({
      code: MAIL_INVALID_MESSAGE,
    });
    const mailer = new Mailer(driver, "app@example.com");
    expect(await mailer.send({ to: "ada@example.com", subject: "Hello", text: "Hi" })).toEqual({
      id: "local-1",
    });
    expect(sent[0]).toMatchObject({ from: "app@example.com", to: ["ada@example.com"] });
    await expect(
      mailer.send({ to: "ada@example.com", from: "  ", subject: "Hello" }),
    ).rejects.toMatchObject({
      code: MAIL_INVALID_MESSAGE,
    });
    expect(
      await mailer.send({
        to: ["ada@example.com"],
        from: "other@example.com",
        subject: "Hello",
        html: "Hi",
      }),
    ).toEqual({ id: "local-1" });
    expect(sent[1]?.from).toBe("other@example.com");

    @Module({ imports: [MailModule.forRoot({ driver, from: "app@example.com" })] })
    class AppModule {}
    const app = await VibeFactory.create(AppModule, {
      logger: new JsonLogger({ level: "silent" }),
    });
    expect(
      await app.get(MAILER).send({ to: "a@example.com", subject: "Hello", text: "Hi" }),
    ).toEqual({
      id: "local-1",
    });
    await app.close();
    expect(() =>
      MailModule.forRoot({ driver: { send: undefined as unknown as MailDriver["send"] } }),
    ).toThrow(expect.objectContaining({ code: MAIL_INVALID_CONFIG }));
  });
});
