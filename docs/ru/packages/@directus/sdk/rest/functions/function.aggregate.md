---
editLink: false
---

# Function: aggregate()

> **aggregate**\<`Schema`, `Collection`, `Options`\>(`collection`, `options`):
> [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`AggregationOutput`](../../types-1/type-aliases/type-alias.AggregationOutput.md)\< `Schema`, `Collection`, `Options`
> \>, `Schema` \>

Aggregate allow you to perform calculations on a set of values, returning a single result.

## Type parameters

| Parameter                                                                                                                           |
| :---------------------------------------------------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                                                         |
| `Collection` _extends_ `string` \| `number` \| `symbol`                                                                             |
| `Options` _extends_ [`AggregationOptions`](../../types-1/type-aliases/type-alias.AggregationOptions.md)\< `Schema`, `Collection` \> |

## Parameters

| Parameter    | Type         | Description                 |
| :----------- | :----------- | :-------------------------- |
| `collection` | `Collection` | The collection to aggregate |
| `options`    | `Options`    | The aggregation options     |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\<
[`AggregationOutput`](../../types-1/type-aliases/type-alias.AggregationOutput.md)\< `Schema`, `Collection`, `Options`
\>, `Schema` \>

Aggregated data

## Source

[rest/commands/read/aggregate.ts:12](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/aggregate.ts#L12)
