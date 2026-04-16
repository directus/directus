---
'@directus/sdk': major
---

Refactor sdk error to use class over object

:::warning
Requests that fail will now throw a `RequestError` instead of returning a response with an `error` property.
:::
