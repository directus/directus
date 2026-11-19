---
'@directus/utils': patch
---

Fixed string field validation rules such as `_ieq`, `_contains` or `_starts_with` returning a 500 error instead of a 400 when the submitted value was an empty string
