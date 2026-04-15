---
'@directus/sdk': major
---

Fixed error handling in sdk

:::warning
Requests that fail will now throw an error instead of returning a response with an `error` property.
:::
