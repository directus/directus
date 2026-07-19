---
'@directus/api': patch
---

Fixed the Data Studio serving stale cached data by always skipping the cache for Data Studio requests, regardless of `CACHE_AUTO_PURGE` and cache-skip settings
