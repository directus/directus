---
"@directus/app": patch
---

Fixed GraphQL validation error when duplicating items with M2A fields that link to collections with conflicting field types.

When duplicating items that have M2A (Many-to-Any) relations pointing to different collections where those collections have fields with the same name but different types (e.g., one JSON field and one relation field both named "items"), GraphQL would throw a validation error because inline fragments require compatible types for fields with the same name.

This fix uses field aliases (prefixed with the collection name) in the generated GraphQL query for M2A inline fragments, then transforms the response data back to use the original field names before creating the duplicated item.
