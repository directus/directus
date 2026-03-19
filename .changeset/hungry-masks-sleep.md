---
'@directus/constants': minor
'@directus/api': minor
'@directus/app': minor
---

Introduced VERSION_KEY_* constants and renamed main to published

::: notice

Backward Compatibility: You can now use `?version=published` to resolve versions of the main item(s) via the version query parameter. For backward compatibility, `?version=main` will continue to work.

:::
