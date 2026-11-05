// oxlint-disable typescript/no-extraneous-class -- module classes are containers
import { Module, token, type DynamicModule, type Token } from "@usevibejs/server";
import { MAIL_INVALID_CONFIG, MailError } from "./errors.ts";
import { Mailer } from "./mailer.ts";
import type { MailDriver } from "./message.ts";

/** Inject this to send mail. */
export const MAILER: Token<Mailer> = token<Mailer>("MAILER");

export interface MailModuleOptions {
  readonly driver: MailDriver;
  /** Used when a message does not set `from`. */
  readonly from?: string;
}

/** Provides `Mailer`. Import `MailModule.forRoot({ driver })`. */
@Module({})
export class MailModule {
  static forRoot(options: MailModuleOptions): DynamicModule {
    if (typeof options.driver.send !== "function") {
      throw new MailError(MAIL_INVALID_CONFIG, "A mail driver with send() is required.");
    }
    return {
      module: MailModule,
      global: true,
      providers: [{ provide: MAILER, useValue: new Mailer(options.driver, options.from) }],
      exports: [MAILER],
    };
  }
}
