---
"@directus/api": patch
---

Fixed the interpretation of CORS config options, allowing to use "falsy" values like `CORS_ORIGIN: false` and `CORS_MAX_AGE: 0`
