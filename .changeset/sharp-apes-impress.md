---
'@directus/schema': patch
'@directus/api': patch
---

Fixed constraint name limits not respected cross db as well as `is_indexed` returning true when only a unique index is set for MSSQL and SQLite