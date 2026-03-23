---
'@directus/schema': patch
'@directus/api': patch
---

Fixed schema introspection for MSSQL text fields with `MAX` length (`-1`) by normalizing to `null` in `parseMaxLength`, preventing invalid SQL like `nvarchar(-1)` during schema application.
