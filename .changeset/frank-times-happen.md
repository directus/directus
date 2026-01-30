---
'@directus/api': patch
---

Added composite index support to `createIndex` helper and added index on `directus_revisions(collection, item, version)`
to fix slow COUNT queries.
