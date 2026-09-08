---
'@directus/api': patch
---

Hardened the GraphQL query parser against prototype pollution through a `__proto__` field alias, completing the earlier fix for GHSA-gwvv-rr68-cmv6
