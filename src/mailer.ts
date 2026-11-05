import type { MailContent, MailDriver, MailEnvelope, MailMessage } from "./message.ts";
import { messageFrom } from "./message.ts";

/** Sends mail through the configured driver. It does not queue. */
export class Mailer {
  private readonly driver: MailDriver;
  private readonly from: string | undefined;

  constructor(driver: MailDriver, from?: string) {
    this.driver = driver;
    this.from = from;
  }

  async send(message: MailContent & MailEnvelope): Promise<{ id: string }> {
    const given = message.from?.trim();
    const from = given === undefined || given === "" ? this.from : given;
    return this.driver.send(delivered(message, from));
  }
}

function delivered(message: MailContent & MailEnvelope, from: string | undefined): MailMessage {
  return messageFrom(message, { from, to: message.to, replyTo: message.replyTo });
}
