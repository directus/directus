---
editLink: false
---

# Function: utilitySort()

> **utilitySort**\<`Schema`\>( `collection`, `item`, `to`): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> `void`, `Schema` \>

If a collection has a sort field, this util can be used to move items in that manual order.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter    | Type             |
| :----------- | :--------------- |
| `collection` | _keyof_ `Schema` |
| `item`       | `string`         |
| `to`         | `number`         |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Nothing

## Source

[rest/commands/utils/sort.ts:8](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/utils/sort.ts#L8)
