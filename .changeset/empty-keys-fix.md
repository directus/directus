---
"@directus/api": patch
---

Fixed a critical bug where passing an empty `keys` array to the Update Items operation would update every item in the collection instead of updating nothing.
