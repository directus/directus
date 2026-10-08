---
'@directus/schema-builder': major
---

Added schema snapshot and TypeScript type generation to the SchemaBuilder via `snapshot()` and `types()`, together with
`toSchemaOverview` and `toTypeScript` functions to convert snapshots into a schema overview or TypeScript types, a
`versioning` collection option, an `on_delete` relation option and an optional reverse field argument for `m2m()`.
Changed the `build()` methods of `CollectionBuilder`, `FieldBuilder` and `RelationBuilder` to take different arguments
and return different shapes, removed `alias` from `FieldOveriewBuilderOptions`, and changed foreign key fields to match
the type of the primary key they reference, changing a2o and translations foreign keys from integers to strings.
Generated m2a junction collections are now named `<collection>_<field>` instead of `<collection>_builder`, o2m
relations now describe the foreign key column on the related collection, and primary keys are no longer nullable
