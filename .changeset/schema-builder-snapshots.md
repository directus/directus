---
'@directus/schema-builder': minor
---

Added schema snapshot and TypeScript type generation to the SchemaBuilder via `snapshot()` and `types()`, together with `toSchemaOverview` and `toTypeScript` functions to convert snapshots into a schema overview or TypeScript types, and a `test_schema` option that suffixes all collections with `_1234`
