---
'@directus/api': patch
---

Fixed GraphQL schema emitting nullable types (e.g. `String`) instead of non-nullable types (e.g. `String!`) for NOT NULL
fields with a default value in read operations. Such fields remain omittable (nullable) in create operations, where the
default value fills in for an omitted field.
