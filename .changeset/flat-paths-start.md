---
'@directus/api': patch
'@directus/utils': major
'@directus/constants': minor
'@directus/extensions': patch
---

Fixed `_some` and `_none` filters ignoring logical and multi-condition sub-filters

:::notice

- Duplicate `isIn` and `isTypeIn` helpers have been removed from `@directus/utils/node`. Import them directly from `@directus/utils` instead.

:::
