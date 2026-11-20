Perform CRUD operations on items within Directus collections.

Input: `{ action, collection, keys?, data?, query? }`

- `read`: `query` with `fields`, `filter`, `sort`, `limit`, `offset`, `search`, `deep`, `aggregate`, `groupBy`. Optional
  `keys` to read specific items.
- `create`: `data` as one object or an array.
- `update`: `data` plus `keys` for the same change on many items, or `data` as an array with each item's primary key for
  different changes. Singletons need no keys.
- `delete`: `keys` only. Read the keys first, never delete by query.

Get exact field names, required fields, and relations from `schema({ keys: ["collection"] })` first. Never guess field
names.

Filter operators: `_eq`, `_neq`, `_in`, `_nin`, `_null`, `_nnull`, `_lt`, `_lte`, `_gt`, `_gte`, `_between`,
`_contains`, `_icontains`, `_starts_with`, `_empty`, `_nempty`, `_some`/`_none` (one-to-many), `_and`, `_or`. Filter
through relations with nesting: `{ "publisher": { "country": { "_eq": "FR" } } }`.

Fields: `["id", "publisher.name", "categories.*"]`. Many-to-any: `"sections.item:headings.title"`.

Relational writes:

- Many-to-one: a key, a nested object to create, or `null`.
- One-to-many and many-to-many: an array of keys or nested objects, or
  `{ "create": [...], "update": [...], "delete": [keys] }` to change some without replacing all.
- Many-to-many rows are junction rows, like `{ "categories_id": 3 }` or `{ "categories_id": { "name": "New" } }`.
- Many-to-any rows: `{ "collection": "headings", "item": { ... } }`.
- Translations rows: `{ "languages_code": "fr-FR", "title": "..." }`.

Show the item URL from create and update results when present.
