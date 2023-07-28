---
editLink: false
---

# Function: deleteOperations()

> **deleteOperations**\<`Schema`\>(`keys`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema`
> \>

Delete multiple existing operations.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                                     |
| :-------- | :------------------------------------------------------------------------------------------------------- |
| `keys`    | [`DirectusOperation`](../../schema/type-aliases/type-alias.DirectusOperation.md)\< `Schema` \>[`"id"`][] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/operations.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/operations.ts#L10)
