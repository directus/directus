---
'@directus/api': patch
---

Fixed column `default_value` dropped on any column change due to `column.alter` not being incremental
