---
'@directus/errors': minor
'@directus/api': patch
---

Added support for constructing `InvalidPayloadError` and `InvalidQueryError` directly from Zod errors via the new `withZodSupport` helper, keeping the original Zod error as `cause`. `zod` is now a peer dependency of `@directus/errors`
