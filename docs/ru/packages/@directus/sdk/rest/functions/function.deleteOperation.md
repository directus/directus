---
editLink: false
---

# Function: deleteOperation()

> **deleteOperation**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete an existing operation.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                                   |
| :-------- | :----------------------------------------------------------------------------------------------------- |
| `key`     | [`DirectusOperation`](../../schema/type-aliases/type-alias.DirectusOperation.md)\< `Schema` \>[`"id"`] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/operations.ts:24](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/operations.ts#L24)
