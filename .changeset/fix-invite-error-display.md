---
"@directus/api": patch
"@directus/app": patch
"@directus/errors": patch
---

Introduce a dedicated `INVALID_INVITE` error code for expired/invalid invite acceptance. The error message is now translated via the i18n system on the frontend instead of being read from `extensions.reason`, ensuring it is localizable and consistent with other error messages. Also removes the `getErrorReason` utility which bypassed the translation system.
