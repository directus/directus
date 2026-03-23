---
'@directus/schema': patch
'@directus/api': patch
---

Fixed schema introspection for MSSQL text fields with `MAX` length (`-1`) by normalizing to `null` in `parseMaxLength`, preventing invalid SQL like `nvarchar(-1)` during schema application.

Fixed applying a schema snapshot that changes `max_length` for a string field in MSSQL not altering the column. The `??` operator was silently discarding explicit `null` values (meaning MAX/unbounded); the fix uses an explicit `!== undefined` check and routes through `table.text()` on MSSQL when `max_length` is `null` to correctly emit `nvarchar(max)`.
