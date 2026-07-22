---
'@directus/sdk': patch
---

Fixed nested filters on relational fields losing type inference, so filtering a related collection's field (e.g. `filter: { o2m: { id: { _eq: 5 } } }`) is now type-checked instead of silently accepting any value
