import { randomUUID } from "node:crypto";
import { MAIL_CONSOLE_IN_PRODUCTION } from "./errors.ts";
import type { MailDriver } from "./message.ts";

export interface ConsoleDriverOptions {
  readonly log?: (line: string) => void;
  readonly warn?: (line: string) => void;
  /** Defaults to `process.env.NODE_ENV`. */
  readonly env?: string;
}

/**
 * Prints the message. In production it warns on every send, because nothing is delivered.
 * There is no queue.
 */
export function consoleDriver(options: ConsoleDriverOptions = {}): MailDriver {
  const log = options.log ?? ((line: string) => console.log(line));
  const warn = options.warn ?? ((line: string) => console.warn(line));
  const env = options.env ?? process.env.NODE_ENV;
  return {
    async send(message) {
      if (env === "production") {
        warn(`${MAIL_CONSOLE_IN_PRODUCTION}: the console mail driver does not deliver mail.`);
      }
      const id = randomUUID();
      log(JSON.stringify({ id, to: message.to, subject: message.subject }));
      return { id };
    },
  };
}
