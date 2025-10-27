---
'@directus/api': patch
---

Add activity and revision tracking for field schema modifications (nullable, default_value, unique, etc.) that bypass
ItemsService and go directly through Knex alterations.

- Added trackFieldSchemaChange utility method in FieldsService
- Track schema changes for both createField and updateField operations
- Activity logs now capture field schema updates with proper collection/item references
- Revisions store schema change deltas when accountability is set to 'all'
