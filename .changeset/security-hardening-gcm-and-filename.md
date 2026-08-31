---
'@directus/api': patch
---

Fixed GCM auth tag handling in decrypt utility to explicitly validate IV/tag length and set authTagLength, and sanitized GraphQL export filename to prevent header injection / info leakage
