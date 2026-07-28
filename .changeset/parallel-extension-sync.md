---
'@directus/api': patch
---

Fixed slow extension sync from remote storage on startup by downloading files concurrently instead of one at a time
