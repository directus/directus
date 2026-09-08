---
'@directus/api': patch
---

Removed saved permission rules for create/update/delete on Collections, Fields, Relations and Extensions, which the API always restricted to admins

::: notice

This migration deletes those rows and is not reversible. The rules had no effect, since the API enforced admin access independently of them.

:::
