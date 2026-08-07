---
'@directus/api': patch
'@directus/env': patch
---

Fixed slow extension sync from remote storage during startup. Added `EXTENSIONS_STORAGE_MAX_CONCURRENCY` to configure the maximum number of concurrent requests to the extensions storage location
