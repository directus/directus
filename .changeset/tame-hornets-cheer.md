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

Breaking changes in `@directus/types`:
- `Notification.id` is now correctly typed as `number`.
- `Notification.status` and `timestamp` are now nullable.

:::
