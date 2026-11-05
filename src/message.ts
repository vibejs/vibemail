import { MAIL_INVALID_MESSAGE, MailError } from "./errors.ts";

/** What a template returns. A template is a plain function of the caller's data. */
export interface MailContent {
  readonly subject: string;
  readonly text?: string;
  readonly html?: string;
}

export type MailTemplate<T> = (data: T) => MailContent;

export interface MailDriver {
  send(message: MailMessage): Promise<{ id: string }>;
}

export interface MailMessage extends MailContent {
  readonly from: string;
  readonly to: readonly string[];
  readonly replyTo?: string;
}

export interface MailEnvelope {
  readonly from?: string;
  readonly to: readonly string[] | string;
  readonly replyTo?: string;
}

/** Builds a message by calling `template`. Templates are not stored or queued. */
export function renderTemplate<T>(
  template: MailTemplate<T>,
  data: T,
  envelope: MailEnvelope,
): MailMessage {
  return messageFrom(template(data), envelope);
}

export function messageFrom(content: MailContent, envelope: MailEnvelope): MailMessage {
  const to = typeof envelope.to === "string" ? [envelope.to] : [...envelope.to];
  return validateMessage({
    from: envelope.from ?? "",
    to,
    replyTo: envelope.replyTo,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
}

function present(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  return trimmed;
}

/** Rejects a message that has no sender, recipient, subject, or body. */
export function validateMessage(message: MailMessage): MailMessage {
  const from = present(message.from);
  const to = message.to.flatMap((item) => {
    const trimmed = present(item);
    return trimmed === undefined ? [] : [trimmed];
  });
  const subject = present(message.subject);
  const text = present(message.text);
  const html = present(message.html);
  if (from === undefined || to.length === 0) {
    throw new MailError(
      MAIL_INVALID_MESSAGE,
      "Mail needs a from address and at least one recipient.",
    );
  }
  if (subject === undefined) {
    throw new MailError(MAIL_INVALID_MESSAGE, "Mail needs a subject.");
  }
  if (text === undefined && html === undefined) {
    throw new MailError(MAIL_INVALID_MESSAGE, "Mail needs text or html.");
  }
  return { from, to, subject, text, html, replyTo: present(message.replyTo) };
}
