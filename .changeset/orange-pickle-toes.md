---
'@directus/types': major
'@directus/sdk': major
'@directus/app': patch
'@directus/api': patch
---

Updated outdated type definitions for `directus_relations`, `directus_policies`, `directus_shares`, `directus_access`, `directus_comments`, and `directus_versions`

::: notice

Breaking changes in `@directus/sdk`:

- `DirectusRelation.meta` and `DirectusRelation.schema` are now nullable
- `DirectusPolicy.ip_access` and `DirectusRelation.meta.one_allowed_collections` are now correctly typed as `string[]`

Breaking changes in `@directus/types`:
- `Policy.enforce_tfa` is no longer nullable
- `Share.name`, `role`, `password`, `user_created`, `date_created` and `times_used` are now nullable

:::
