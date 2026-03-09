---
'@directus/utils': patch
'@directus/api': patch
'@directus/app': patch
---

Fixed Data Studio date validation error when using field references (`end_date` > `{{start_date}}`).  Validation rules that reference another field via `{{fieldName}}` are now resolved from the current item/payload before validation in both the API and the Data Studio, so item create/update no longer throws "date must have a valid date format or reference".
