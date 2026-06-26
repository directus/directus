---
'@directus/specs': patch
---

Added LDAP credential login to `/auth/login/{provider}`, missing `prompt`/`otp` query params to the SSO flow, and `reset_url` to the password reset request.
