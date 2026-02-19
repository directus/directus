---
'@directus/api': minor
'@directus/types': minor
---

Added `--concurrent-index-creation` flag to `schema apply` CLI command to support concurrent index creation outside of the transaction, reducing table locks on large tables
