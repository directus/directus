---
'@directus/api': minor
'@directus/env': minor
---

Added native `mailtrap` email transport support via `EMAIL_TRANSPORT=mailtrap`

::: notice

The transport is configured through the following environment variables:

- `EMAIL_MAILTRAP_TOKEN` — an API token from https://mailtrap.io/api-tokens. Required.
- `EMAIL_MAILTRAP_SANDBOX` — send to the testing inbox instead of real recipients.
- `EMAIL_MAILTRAP_TEST_INBOX_ID` — which testing inbox to send to. Required in sandbox mode.
- `EMAIL_MAILTRAP_BULK` — send via the bulk stream. Cannot be combined with sandbox mode.

:::
