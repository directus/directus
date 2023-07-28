---
editLink: false
---

# Type alias: AggregationOptions`<Schema, Collection, Fields, Item>`

> **AggregationOptions**: \<`Schema`, `Collection`, `Fields`, `Item`\> `object`

Aggregation input options

## Type parameters

| Parameter                                                                             | Default                                                                                                                                                                               |
| :------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Schema` _extends_ `object`                                                           | -                                                                                                                                                                                     |
| `Collection` _extends_ [`AllCollections`](type-alias.AllCollections.md)\< `Schema` \> | -                                                                                                                                                                                     |
| `Fields`                                                                              | `Collection` _extends_ _keyof_ `Schema` ? _keyof_ [`UnpackList`](type-alias.UnpackList.md)\< [`GetCollection`](type-alias.GetCollection.md)\< `Schema`, `Collection` \> \> : `string` |
| `Item`                                                                                | `Collection` _extends_ _keyof_ `Schema` ? [`UnpackList`](type-alias.UnpackList.md)\< [`GetCollection`](type-alias.GetCollection.md)\< `Schema`, `Collection` \> \> : `object`         |

## Type declaration

### aggregate

**aggregate**: [`AggregateRecord`](type-alias.AggregateRecord.md)\< `Fields` \>

---

### groupBy

`optional` **groupBy**: (`Fields` \| [`GroupByFields`](type-alias.GroupByFields.md)\< `Schema`, `Item` \>)[]

---

### query

`optional` **query**: `Omit`\< [`Query`](../interfaces/interface.Query.md)\< `Schema`, `Item` \>, `"fields"` \| `"deep"`
\| `"alias"` \>

## Source

[types/aggregate.ts:61](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/aggregate.ts#L61)
