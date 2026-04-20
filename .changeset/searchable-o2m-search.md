---
'@directus/api': minor
'@directus/app': minor
'@directus/constants': minor
---

Directus Studio search now matches text in the fields of any one-to-many related collection — including translation junctions — when the o2m alias field and its target fields are marked Searchable. The Searchable toggle is now surfaced in the field detail UI for `translations` and `o2m` localTypes. Existing relational fields default to non-searchable via a one-time data migration; admins opt in per-field.
