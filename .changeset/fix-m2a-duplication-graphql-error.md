---
"@directus/app": patch
---

Fixed GraphQL validation error when duplicating items with M2A fields that link to collections with conflicting field types by using field aliases in M2A inline fragments and transforming the response back to original field names.
