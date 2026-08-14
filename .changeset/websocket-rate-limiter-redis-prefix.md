---
'@directus/api': patch
'@directus/env': patch
---

Fixed WebSocket rate limiting breaking on shared Redis setups where keys must start with a per-project prefix. The WebSocket limiter now accepts `RATE_LIMITER_WEBSOCKETS_*` values as overrides on top of the main rate limiter settings, including `RATE_LIMITER_WEBSOCKETS_KEY_PREFIX` to override the Redis key prefix.
