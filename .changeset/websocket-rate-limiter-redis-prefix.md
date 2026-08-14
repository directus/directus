---
'@directus/api': patch
'@directus/env': patch
---

Fixed WebSocket rate limiting breaking on shared Redis setups where keys must start with a per-project prefix. The WebSocket limiter now has its own config group (`RATE_LIMITER_WEBSOCKETS_*`), including `RATE_LIMITER_WEBSOCKETS_KEY_PREFIX` to override the Redis key prefix.
