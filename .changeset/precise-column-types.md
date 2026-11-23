---
'@directus/schema': minor
'@directus/sdk': minor
'@directus/api': minor
---

Added `full_data_type` to the inspected column info, holding the column type as declared including its length, precision and other modifiers, like `varchar(255)` or `numeric(10,2)`. It is also returned in the `schema` of fields
