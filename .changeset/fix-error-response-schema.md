---
'@directus/specs': patch
'@directus/api': patch
---

Fixed error response schemas to match actual API shape: replaced singular `error` object with `errors` array containing `message` and `extensions.code`. Added `Error` to `OAS_REQUIRED_SCHEMAS` so the dynamic spec at `/server/specs/oas` includes the schema definition.
