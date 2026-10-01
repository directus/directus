---
'@directus/app': patch
'@directus/types': major
'@directus/sdk': major
---

Updated outdated type definitions for `directus_notifications`, `directus_permissions`, `directus_extensions`, `directus_fields`, `directus_activity`, `directus_collections`, and `directus_revisions`

::: notice

Breaking changes in `@directus/sdk`:
- `DirectusNotification.id` is now correctly typed as `number`.
- `DirectusField.schema` is now nullable.
- `FieldMetaConditionOptionType` has been removed; condition `options` is now `Record<string, any>`.
- `FieldMetaConditionType.hidden`, `readonly`, `required`, and `options` are now optional, and `rule` is typed as a filter.
- All `ExtensionSchema` properties are now optional, and `DirectusExtension.schema` can also be an `ExtensionSchemaEntry`.

Breaking changes in `@directus/types`:
- `Notification.id` is now correctly typed as `number`.
- `Notification.status` and `timestamp` are now nullable.

:::
