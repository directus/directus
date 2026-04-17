---
'@directus/api': patch
---

Fixed health check endpoint ignoring EMAIL_VERIFY_SETUP configuration. The /server/health endpoint unconditionally called mailer.verify(), causing 503 responses when the email transport verification fails (e.g., SES with restricted IAM policies), even when EMAIL_VERIFY_SETUP was set to false.
