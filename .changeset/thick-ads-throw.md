---
'@directus/api': minor
'@directus/specs': minor
'@directus/sdk': major
---

Added a `mode` parameter and partial snapshot support to the schema diff endpoint

::: notice

The SDK `schemaDiff` command now takes its options as an object (`schemaDiff(snapshot, { force, mode })`)

:::
