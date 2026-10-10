---
'@directus/api': patch
---

Fixed `_some` and `_none` relational filters being ignored when their inner filter wrapped `_and` or `_or`.
