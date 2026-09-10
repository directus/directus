---
'@directus/types': patch
'@directus/api': patch
'@directus/app': patch
'@directus/sdk': patch
---

Updated outdated type definitions for `directus_comments`, `directus_flows`, `directus_operations`, `directus_presets`, `directus_roles`, and `directus_versions`

::: notice

The following fields are now correctly marked as nullable:

- `@directus/types`: `Comment.user_created`, `Comment.user_updated`, `FlowRaw.user_created`, `OperationRaw.options`, `OperationRaw.user_created`, `Preset.collection`, `Role.description`, and `ContentVersion.hash`
- `@directus/sdk`: `DirectusRole.parent` and `DirectusVersion.hash`

:::
