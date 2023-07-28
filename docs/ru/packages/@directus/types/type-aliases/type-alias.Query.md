---
editLink: false
---

# Type alias: Query

> **Query**: `object`

## Type declaration

### aggregate

`optional` **aggregate**: [`Aggregate`](type-alias.Aggregate.md) \| `null`

---

### alias

`optional` **alias**: `Record`\< `string`, `string` \> \| `null`

---

### deep

`optional` **deep**: [`NestedDeepQuery`](type-alias.NestedDeepQuery.md) \| `null`

---

### export

`optional` **export**: `"json"` \| `"csv"` \| `"xml"` \| `null`

---

### fields

`optional` **fields**: `string`[] \| `null`

---

### filter

`optional` **filter**: [`Filter`](type-alias.Filter.md) \| `null`

---

### group

`optional` **group**: `string`[] \| `null`

---

### limit

`optional` **limit**: `number` \| `null`

---

### offset

`optional` **offset**: `number` \| `null`

---

### page

`optional` **page**: `number` \| `null`

---

### search

`optional` **search**: `string` \| `null`

---

### sort

`optional` **sort**: `string`[] \| `null`

## Source

[types/src/query.ts:3](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/query.ts#L3)
