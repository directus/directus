---
'@directus/app': patch
---

Sped up field, relation, and collection lookups in the Data Studio by indexing the stores instead of scanning every
field on each call. Store fields, relations, and collections are no longer deeply reactive, so extensions that edit them
in place should use `upsertField` or the store's other update functions instead
