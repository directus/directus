---
'@directus/api': major
'@directus/env': patch
---

Reworked getSchema to rely on runExclusive for preventing locking stalemates

::: notice
The `CACHE_SCHEMA_MAX_ITERATIONS` env var got removed and the `CACHE_SCHEMA_SYNC_TIMEOUT` env now also controlls the timeout for getting the schema itself.
:::
