---
'@directus/api': patch
---

Fixed `directus_relations` subscriptions sending relation events without enforcing read permissions. Relation events are now read through the relations service, so subscribers only receive relations on collections and fields they can read.
