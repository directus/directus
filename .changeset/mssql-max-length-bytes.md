---
'@directus/schema': patch
---

Fixed MSSQL schema introspection reporting the storage size in bytes as `max_length` for non-character types (e.g. `decimal(12,2)` reported `max_length: 9`), which incorrectly capped the input length for decimal, bigint, and uuid fields in the Data Studio
