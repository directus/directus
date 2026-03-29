---
'@directus/api': patch
---

Health check results are now cached via HEALTHCHECK_CACHE_TTL (default 5m) and shared across instances

::: notice
Health checks are now cached by default and shared across multi instance deployments
:::
