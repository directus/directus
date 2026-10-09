---
'@directus/api': patch
---

Fixed relational filters wrapped in `_and` / `_or` being silently dropped

Filtering on a relational field with a logical group instead of an operator, for example
`{ "links": { "_and": [{ "name": { "_eq": 2 } }] } }`, silently dropped the filter entirely
while the join was still added. This caused the query to match **every** row instead of the
filtered subset. The nested conditions are now applied to the joined relation.
