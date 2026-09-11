---
'@directus/api': patch
---

Fixed read permissions not enforced when resolving item keys for `updateByQuery` and `deleteByQuery`

::: notice

Update/delete by query now resolves the affected items with the read permissions enforced:

- Read access to the collection's primary key field is now required.
- The affected items are scoped to what the role can read, irrespective of update rights.
- Nested o2m saves require read access on the child collection.

:::
