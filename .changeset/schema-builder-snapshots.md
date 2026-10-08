---
'@directus/schema-builder': major
---

Added schema snapshot and TypeScript type generation to the SchemaBuilder via `snapshot()` and `types()`, together with
`toSchemaOverview` and `toTypeScript` functions to convert snapshots into a schema overview or TypeScript types, and a
`test_schema` snapshot option that suffixes all collections with `_1234`, a `versioning` collection option and an
`on_delete` relation option. Changed the `build()` methods of `CollectionBuilder`, `FieldBuilder` and `RelationBuilder`
to take different arguments and return different shapes, removed `alias` from `FieldOveriewBuilderOptions`, and changed
foreign key fields to match the type of the primary key they reference, changing a2o and translations foreign keys
from integers to strings
