---
'@directus/api': patch
'@directus/env': patch
---

Improved performance of bulk item creation by inserting rows in batched queries instead of running one insert per row
