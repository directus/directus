---
'@directus/api': patch
---

Fixed PostgreSQL queries failing when a permission rule compiles to an empty condition (for example a rule referencing
fields or relations that no longer exist). The CASE/WHEN fallback now uses a boolean-valid expression, matching the
behaviour MySQL and SQLite already had.
