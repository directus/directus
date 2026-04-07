---
'@directus/api': major
---

Fixed health check results not being shared in multi-instance settings. Restricted `/server/health` to authenticated users

::: notice
- Health checks are cached by default and shared across multi-instance deployments
- `/server/health` will return 404 for unauthenticated requests, use `/server/ping` for liveness checks
:::
