---
'@directus/composables': patch
---

fix(composables): eliminate redundant API count requests in `useItems`

Merged the two separate `watch` blocks in `useItems` into a single one that
also watches `filterSystem`. A new `shouldUpdateTotal` flag is derived from
collection or `filterSystem` changes, and `getTotalCount` is now called
inside the throttled `fetchItems` alongside `getItems` and `getItemCount`.

This removes the duplicate `aggregate[countDistinct]` requests that occurred
on page init, route navigation, and bookmark switching — reducing up to 3
redundant count calls down to 1 per trigger.

Fixes #25194
