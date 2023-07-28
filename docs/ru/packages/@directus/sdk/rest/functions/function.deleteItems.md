---
editLink: false
---

# Function: deleteItems()

> **deleteItems**\<`Schema`, `Collection`, `TQuery`\>(`collection`, `keysOrQuery`):
> [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete multiple existing items.

## Type parameters

| Parameter                                                                                                       |
| :-------------------------------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                                     |
| `Collection` _extends_ `string` \| `number` \| `symbol`                                                         |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, `Schema`[`Collection`] \> |

## Parameters

| Parameter     | Type                       | Description                 |
| :------------ | :------------------------- | :-------------------------- |
| `collection`  | `Collection`               | The collection of the items |
| `keysOrQuery` | `PrimaryKey`[] \| `TQuery` | The primary keys or a query |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Nothing

## Source

[rest/commands/delete/items.ts:14](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/items.ts#L14)
