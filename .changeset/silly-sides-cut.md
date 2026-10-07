---
'@directus/api': major
'@directus/env': patch
---

Fixed requests failing after a process was stopped during schema building

::: notice

`CACHE_SCHEMA_MAX_ITERATIONS` has been removed. `CACHE_SCHEMA_SYNC_TIMEOUT` now also limits the schema build itself and defaults to `60000` ms.

If you have configured a lower value, make sure it is long enough for your schema to finish building.

:::
