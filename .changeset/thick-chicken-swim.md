---
'@directus/api': patch
---

Fixed API queries with the `search` parameter to return no results if the query is not applicable to any fields

::: notice
Previously, the API returned all items for collections where the `search` parameter was not applicable to any fields. Now the API returns no items in such a case.
:::
