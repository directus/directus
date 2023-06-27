---
'@directus/api': major
'@directus/validation': patch
'@directus/errors': patch
'@directus/types': patch
'@directus/utils': patch
'@directus/app': patch
---

::: notice

Extensions no longer get an `errors` meta object that contains shared errors. Instead, you can create your own DirectusError using @directus/errors. Please see https://github.com/directus/directus/tree/main/packages/errors or the updated extension docs for more information.

Some error messages returned by the API have changed slightly. Error codes, extensions, and HTTP statuses have remained the same. Take note if you were parsing through the raw API error message, or were displaying the error message as-is in your project.

:::

Create and use new @directus/errors package for standardized errors across the Directus ecosystem.

