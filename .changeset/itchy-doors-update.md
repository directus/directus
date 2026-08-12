---
'@directus/api': major
---

Fixed "Update Items" and "Delete Items" operations affecting every item in a collection when given empty keys or query

::: notice

**Nothing to target is a no-op**

"Update Items" and "Delete Items" operations now return `null` for configurations that don't target anything (e.g. `[]`). Flows that relied on the previous fallback to every item can use `{"limit": -1}`.

**Contradictory options error**

"Update Items" and "Delete Items" operations now throw an error for invalid configurations (e.g. when both `keys` and `query` are defined).
