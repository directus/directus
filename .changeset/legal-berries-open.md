---
'@directus/types': patch
'@directus/api': patch
'@directus/app': patch
'@directus/sdk': patch
---

Fixed nullability of `operation.options`, `preset.collection`, and `version.hash` to match the database schema, and
updated their consumers to handle `null` correctly.
