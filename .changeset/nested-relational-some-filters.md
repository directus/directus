---
'@directus/api': patch
'@directus/utils': patch
---

Fixed nested relational filters using `_some` and `_none` so logical groups stay scoped to the correct related item instead of being lifted out during filter normalization.
