---
'@directus/errors': minor
'@directus/api': patch
---

Added `withZodSupport` and `formatZodError` to construct `InvalidPayloadError` and `InvalidQueryError` from Zod errors, replacing `zod-validation-error`
