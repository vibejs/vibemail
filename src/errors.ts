/** Stable codes owned by `@usevibejs/mail`. They are not vibe.js `VIBE` codes. */
export const MAIL_INVALID_CONFIG = "MAIL_INVALID_CONFIG";
export const MAIL_INVALID_MESSAGE = "MAIL_INVALID_MESSAGE";
export const MAIL_SEND_FAILED = "MAIL_SEND_FAILED";
/** Logged by the console driver in production. The message is not delivered. */
export const MAIL_CONSOLE_IN_PRODUCTION = "MAIL_CONSOLE_IN_PRODUCTION";

/** A mail error. `code` is stable. */
export class MailError extends Error {
  override readonly name = "MailError";
  readonly code: string;

  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.code = code;
  }
}
