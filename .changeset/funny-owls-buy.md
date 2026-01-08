---
"@directus/api": major
"@directus/app": patch
"@directus/env": minor
---

Added multi-domain support for OAuth/OpenID

::: notice

SSO callback URL generation and redirect validation now include port matching to ensure redirects target the correct server.

:::
