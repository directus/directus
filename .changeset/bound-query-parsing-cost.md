---
'@directus/api': minor
'@directus/env': minor
'@directus/constants': minor
'@directus/utils': patch
---

Bounded the work that parsing query parameters can cause

::: notice

`filter` and `deep` are now rejected with an `InvalidQueryError` once they exceed a limit on
serialized size, total node count, or nesting depth. Queries within the limits are unaffected.

The size and node limits are a single allowance spent across a whole query, so a filter nested
under `deep` draws from what is left rather than starting over. Set a limit to `Infinity` to opt
out of it.

- `QUERY_FILTER_MAX_SIZE` (default `32768`) — characters of serialized `filter`/`deep` input
- `QUERY_FILTER_MAX_NODES` (default `10000`) — total `filter`/`deep` nodes
- `QUERY_FILTER_MAX_DEPTH` (default `50`) — nesting depth of a single filter
- `QUERY_DEEP_MAX_DEPTH` (default `20`) — nesting depth of `deep`

A `$NOW(...)` adjustment longer than 64 characters is now treated as unparseable, which also
rejects a zero-padded amount that long, such as `$NOW(0000…0005s)`. A dynamic variable path deeper
than 25 segments now resolves to its default value.

:::