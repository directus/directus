---
'@directus/specs': patch
'@directus/api': patch
---

Gate `/auth/login/{provider}` paths behind `AUTH_PROVIDERS` in the dynamic spec. Extends the existing `x-enabled-env` tag mechanism to path items so provider-specific auth endpoints are hidden when no external auth providers are configured.
