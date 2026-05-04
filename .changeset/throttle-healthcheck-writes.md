---
'@directus/api': minor
---

Added optional `STORAGE_<LOCATION>_HEALTHCHECK_WRITE_INTERVAL` environment variable to throttle healthcheck writes (PUT)
to object storage. When set, health checks only perform lightweight reads (GET) within the interval, dramatically
reducing PUT operations and helping stay within free tier limits
