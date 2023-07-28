---
editLink: false
---

# Type alias: AggregateRecord`<Fields>`

> **AggregateRecord**: \<`Fields`\> \{ [Func in keyof AggregationTypes]?: Fields \| (AggregationTypes[Func]["wildcard"]
> extends never ? never : "\*") }

Aggregation parameters

## Type parameters

| Parameter | Default  |
| :-------- | :------- |
| `Fields`  | `string` |

## Source

[types/aggregate.ts:47](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/aggregate.ts#L47)
