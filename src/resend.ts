import { MAIL_INVALID_CONFIG, MAIL_SEND_FAILED, MailError } from "./errors.ts";
import type { MailDriver, MailMessage } from "./message.ts";

export interface ResendDriverOptions {
  readonly apiKey: string;
  readonly fetch?: typeof fetch;
  readonly baseUrl?: string;
}

/** Sends one message with the Resend HTTP API. There is no queue. */
export function resendDriver(options: ResendDriverOptions): MailDriver {
  if (options.apiKey.trim() === "") {
    throw new MailError(MAIL_INVALID_CONFIG, "Resend requires an API key.");
  }
  const fetchImpl = options.fetch ?? fetch;
  const baseUrl = options.baseUrl ?? "https://api.resend.com";
  return {
    async send(message) {
      const response = await fetchImpl(`${baseUrl}/emails`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${options.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload(message)),
      });
      if (!response.ok) {
        throw new MailError(MAIL_SEND_FAILED, `Resend rejected the message (${response.status}).`);
      }
      const id = messageId(await response.json());
      if (id === undefined) {
        throw new MailError(MAIL_SEND_FAILED, "Resend returned no message id.");
      }
      return { id };
    },
  };
}

function messageId(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const id = Reflect.get(value, "id");
  if (typeof id !== "string" || id === "") return undefined;
  return id;
}

function payload(message: MailMessage): Record<string, unknown> {
  const body: Record<string, unknown> = {
    from: message.from,
    to: [...message.to],
    subject: message.subject,
  };
  if (message.text !== undefined) body.text = message.text;
  if (message.html !== undefined) body.html = message.html;
  if (message.replyTo !== undefined) body.reply_to = message.replyTo;
  return body;
}
