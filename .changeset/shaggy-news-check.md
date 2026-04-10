---
'@directus/api': major
'@directus/types': minor
'@directus/sdk': 'patch'
---

Fixed health check results not being shared in multi-instance settings. Restricted `/server/health` to authenticated users

::: notice
- Health checks are cached by default and shared across multi-instance deployments
- `/server/health` will return 404 for unauthenticated requests, use `/server/ping` for liveness checks
- `cache`, `rateLimiter` and `rateLimiterGlobal` health checks have been replaced by a generic `redis` check using the `redis:` prefix
:::
