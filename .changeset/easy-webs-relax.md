---
'@directus/specs': patch
'@directus/api': patch
---

Fixed creating a collection with neither schema nor meta returning a misleading 403 instead of a 400 validation error
