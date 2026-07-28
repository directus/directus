---
'@directus/api': patch
---

Fixed slow extension sync from remote storage on startup by downloading files concurrently instead of one at a time. The number of concurrent downloads is configurable via the new `EXTENSIONS_SYNC_MAX_CONCURRENCY` environment variable (default 20).
