---
'@directus/api': patch
---

Avoided a full schema cache reload on permission, policy, and access mutations. These do not affect the schema (`SchemaOverview` only holds collections and relations), so they now invalidate the permission-related caches without reloading the schema from the database. This speeds up permission/policy saves, especially under database round-trip latency.
