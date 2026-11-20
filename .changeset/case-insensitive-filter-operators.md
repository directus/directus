---
'@directus/api': minor
'@directus/app': minor
'@directus/types': minor
'@directus/utils': minor
'@directus/validation': minor
'@directus/sdk': minor
'@directus/system-data': minor
---

Added support for the `_ieq`, `_nieq` and `_nicontains` filter operators on string fields in REST, GraphQL, field validation and the filter interface, and fixed string field validation rules returning a 500 error instead of a 400 for empty strings or non-string values
