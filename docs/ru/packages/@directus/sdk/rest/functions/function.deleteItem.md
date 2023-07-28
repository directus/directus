---
editLink: false
---

# Function: deleteItem()

> **deleteItem**\<`Schema`, `Collection`\>(`collection`, `key`):
> [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete an existing item.

## Type parameters

| Parameter                                               |
| :------------------------------------------------------ |
| `Schema` _extends_ `object`                             |
| `Collection` _extends_ `string` \| `number` \| `symbol` |

## Parameters

| Parameter    | Type         | Description                 |
| :----------- | :----------- | :-------------------------- |
| `collection` | `Collection` | The collection of the item  |
| `key`        | `PrimaryKey` | The primary key of the item |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Nothing

## Source

[rest/commands/delete/items.ts:41](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/items.ts#L41)
