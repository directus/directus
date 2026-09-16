---
'@directus/memory': patch
---

Fixed concurrent local KV updates losing increments or overwriting larger values in `setMax`.
