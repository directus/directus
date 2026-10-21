---
'@directus/errors': minor
'@directus/api': patch
---

Added support for constructing `InvalidPayloadError` and `InvalidQueryError` directly from Zod errors via the new `withZodSupport` helper, keeping the original Zod error as `cause`. Zod validation messages are now formatted by the new `formatZodError` helper instead of `zod-validation-error`, which drops the `Validation error: ` prefix from error reasons
