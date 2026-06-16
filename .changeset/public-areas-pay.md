---
'@directus/api': patch
---

Enforced the same query token limit and introspection restrictions on the GraphQL WebSocket as on the HTTP endpoint, and stopped leaking schema field names through "Did you mean …?" validation hints when introspection is disabled (both transports)
