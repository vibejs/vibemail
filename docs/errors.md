# Error codes

These codes belong to `@usevibejs/mail`. The `VIBE` series belongs to the vibe.js monorepo and is not used here.

| Code                         | Meaning                                                        |
| ---------------------------- | -------------------------------------------------------------- |
| `MAIL_INVALID_CONFIG`        | Thrown when the driver or Resend API key is missing.           |
| `MAIL_INVALID_MESSAGE`       | Thrown when from, to, subject, or a body is missing.           |
| `MAIL_SEND_FAILED`           | Thrown when Resend rejects the message or returns no id.       |
| `MAIL_CONSOLE_IN_PRODUCTION` | Warned on every production send. The message is not delivered. |
