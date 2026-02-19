---
"@directus/app": patch
---

Fixed performance degradation when editing forms with large GeoJSON geometry fields by using selective shallow cloning for geometry values.
