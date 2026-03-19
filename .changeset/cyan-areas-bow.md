---
'@directus/system-data': minor
'@directus/app': minor
---

Replaced status field with archived boolean in collection settings

::: notice

Backward Compatibility: Existing collections with string-based status fields continue to work unchanged; newly created collections now default to a boolean "Archived" field instead of the string "Status" field

:::
