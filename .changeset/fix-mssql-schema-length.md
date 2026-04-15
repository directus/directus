---
'@directus/schema': patch
'@directus/api': patch
---

Fixed schema introspection for MSSQL text fields with max length of -1 to be normalized to null
