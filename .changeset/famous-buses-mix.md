---
'@directus/schema': patch
---

Fix MySQL/MariaDB schema introspection so `AUTO_INCREMENT` columns remain recognized when `INFORMATION_SCHEMA.COLUMNS.EXTRA` also includes additional flags such as `INVISIBLE`.
