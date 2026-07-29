---
'@directus/system-data': patch
'@directus/api': major
'@directus/app': patch
---

Restricted the settings fields readable with minimal app access to those actually needed by non-admin users, no longer exposing admin-only and sensitive AI configuration fields

::: notice

The minimal app permissions now grant read access to only a subset of `directus_settings` fields. This applies to new policies, existing policies are untouched.

:::