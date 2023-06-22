---
'@directus/api': major
'@directus/validation': patch
'@directus/errors': patch
'@directus/types': patch
'@directus/utils': patch
'@directus/app': patch
---

::: notice 

API errors have the same codes and extensions, but the error message might've changed slightly for some
errors. Take note if you were parsing through the raw API errors.

:::

Create and use new @directus/errors package for standardized errors across the Directus ecosystem.
