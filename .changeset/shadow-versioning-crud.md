---
'@directus/utils': minor
'@directus/schema': minor
'@directus/sdk': minor
'@directus/api': minor
---

- Added `declared_type` to the inspected column info, holding the column type as declared including its length, precision and other modifiers, like `varchar(255)` or `numeric(10,2)`. It is also returned in the `schema` of fields
- Added support for merging any number of filters with `mergeFilters` by passing them as an array, skipping `null` and `undefined` entries
- Added `isImplicitRelation` to check whether a field is an implicit `$FOLLOW(...)` reverse relation
