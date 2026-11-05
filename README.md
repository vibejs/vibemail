# Vibe Mail

**Mail for vibe.js. Console and Resend drivers, plain templates, no queue.**

The package name is `@usevibejs/mail`.

## Install

```bash
pnpm add @usevibejs/mail @usevibejs/server
```

## Quick start

`Mailer.send` delivers through the configured driver. A template is a plain function. This package does not queue; that belongs to `@usevibejs/jobs`.

```ts
import { MailModule, renderTemplate } from "@usevibejs/mail";
import { consoleDriver } from "@usevibejs/mail";

const message = renderTemplate((name: string) => ({ subject: "Hello", text: name }), "Ada", {
  from: "app@example.com",
  to: "ada@example.com",
});
MailModule.forRoot({ driver: consoleDriver(), from: "app@example.com" });
```

The console driver warns in production because it does not deliver mail.

## Error codes

See [docs/errors.md](docs/errors.md).

## Local development

```bash
pnpm install
pnpm check
```

`pnpm check` formats, lints, typechecks, and runs tests at 100% per-file coverage.

## Releases

Releases use changesets. A maintainer runs the Release workflow from main. Do not publish by hand.

## License

MIT. See [LICENSE](LICENSE) and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
