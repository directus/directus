---
'@directus/api': patch
'@directus/memory': patch
---

Fixed the schema cache lock never expiring when the process building the schema is killed before it can release it, which previously stalled the whole instance with "hit infinite loop" errors until `CACHE_SCHEMA_MAX_ITERATIONS` was reached.
