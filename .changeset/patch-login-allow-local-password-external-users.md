---
'@directus/api': minor
---

Added support for local email/password login for users registered with an external OAuth provider. When `AUTH_ALLOW_LOCAL_PASSWORD_FOR_EXTERNAL_USERS=true` is set, users who have both a password and an external provider (e.g. Google) configured can authenticate via the default local provider using their email and password.
