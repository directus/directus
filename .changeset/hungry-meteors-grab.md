---
'@directus/app': patch
'@directus/api': patch
'@directus/utils': minor
---

Fixed searching a many-to-many list so it matches the related fields shown in the list, not only the junction's own fields. Searching a number no longer matches hidden ID fields, such as the junction row ID
