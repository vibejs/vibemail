export { consoleDriver, type ConsoleDriverOptions } from "./console.ts";
export {
  MAIL_CONSOLE_IN_PRODUCTION,
  MAIL_INVALID_CONFIG,
  MAIL_INVALID_MESSAGE,
  MAIL_SEND_FAILED,
  MailError,
} from "./errors.ts";
export { Mailer } from "./mailer.ts";
export { MAILER, MailModule, type MailModuleOptions } from "./module.ts";
export {
  messageFrom,
  renderTemplate,
  validateMessage,
  type MailContent,
  type MailDriver,
  type MailEnvelope,
  type MailMessage,
  type MailTemplate,
} from "./message.ts";
export { resendDriver, type ResendDriverOptions } from "./resend.ts";
