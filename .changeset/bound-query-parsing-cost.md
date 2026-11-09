---
'@directus/api': minor
'@directus/env': minor
'@directus/utils': patch
---

Bounded the work that parsing query parameters can cause

::: notice

`filter` and `deep` are now rejected with an `InvalidQueryError` once they exceed a limit on total node count or nesting depth.

The node allowance is spent across a whole query, so a filter nested under `deep` draws from what is left rather than starting over. Set a limit to `Infinity` to opt out of it.

- `QUERY_FILTER_MAX_NODES` (default `10000`) — total `filter`/`deep` nodes
- `QUERY_FILTER_MAX_DEPTH` (default `50`) — nesting depth of a filter or of `deep`
- `GRAPHQL_QUERY_SELECTION_LIMIT` (default `10000`) — fields a GraphQL operation may select across all its root fields once its fragments are expanded, checked during validation

`QUERY_FILTER_MAX_NODES` is the one most likely to be reached. Every object, array and value counts,
so `{"id":{"_in":[…]}}` costs one node per value plus three, and an `_in` of more than 9997 values is
rejected.

A `$NOW(...)` adjustment longer than 64 characters is now treated as unparseable, which also rejects
a zero-padded amount that long, such as `$NOW(0000…0005s)`. A dynamic variable path deeper than 25
segments now resolves to its default value.

:::
