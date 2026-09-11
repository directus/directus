---
'@directus/app': patch
'@directus/api': patch
---

Made admin-only permission actions read-only in the policy editor and removed their ineffective permission rows

::: notice

Upgrading deletes existing `directus_permissions` rows for create/update/delete on Collections, Fields, Relations and Extensions. The API has always required admin for these, so the rules had no effect; the change is not reversible.

:::
