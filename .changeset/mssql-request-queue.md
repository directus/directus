---
'@directus/api': patch
'@directus/schema': patch
---

Fixed several MS SQL Server reliability and performance issues:

- Rewrote schema introspection to a single `sys.*` overview query instead of per-table lookups, greatly reducing schema-read time on large databases
- Only use the trigger-compatible insert path when the table actually has triggers, so a failed insert no longer leaks a temp table onto the connection