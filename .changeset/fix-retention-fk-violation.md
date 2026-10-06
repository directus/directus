---
'@directus/api': patch
---

Fixed a foreign key violation in the retention schedule when a revision's parent revision was already deleted, and capped `RETENTION_BATCH` at the database's maximum `IN` list size
