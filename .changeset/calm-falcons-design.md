---
'@directus/env': major
---

Changed the default of `IP_TRUST_PROXY` from `true` to `false` to harden the default deployment against IP spoofing.

::: notice
The `IP_TRUST_PROXY` default was changed from `true` to `false`. If you run Directus behind a reverse proxy and rely on `X-Forwarded-For` (or similar) headers for client IP resolution, you must now explicitly set `IP_TRUST_PROXY` to `true` or a more specific trust configuration.
:::
