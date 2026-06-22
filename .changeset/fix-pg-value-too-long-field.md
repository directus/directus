---
'@directus/api': patch
---

Stopped guessing the field name for Postgres "value too long" (22001) errors, which could report an unrelated field on multi-field inserts
