---
'@directus/api': patch
---

Fixed bulk update/delete of comments not requiring an authenticated user

::: notice

`PATCH /comments` and `DELETE /comments` with a `keys` or `query` body (and array-body `DELETE /comments`) now correctly
require an authenticated user, matching the existing requirement on the single-item `/comments/{id}` endpoints.

:::
