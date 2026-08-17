---
'@directus/api': major
---

Fixed "Update Items" and "Delete Items" operations affecting every item in a collection when given an empty or missing key or query

::: notice

**Nothing to target is a no-op**

"Update Items" and "Delete Items" operations now return `null` instead of falling back to every item whenever the configuration doesn't target anything — that is, when `key` is empty or missing (e.g. `[]`, `""`) and `query` is empty or missing (e.g. `{}`). "Update Items" additionally returns `null` when there is nothing to write, i.e. an empty or missing `payload` (e.g. `{}`, or `[]` for a batch payload). Flows that relied on the previous fallback to every item can use `{"limit": -1}`.

**Contradictory options error**

"Update Items" and "Delete Items" operations now throw an error when both `key` and `query` are defined. "Update Items" also throws when `key` or `query` is combined with a batch payload.

:::
