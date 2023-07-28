---
editLink: false
---

# Function: deleteFlow()

> **deleteFlow**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete an existing flow.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                         |
| :-------- | :------------------------------------------------------------------------------------------- |
| `key`     | [`DirectusFlow`](../../schema/type-aliases/type-alias.DirectusFlow.md)\< `Schema` \>[`"id"`] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/flows.ts:24](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/flows.ts#L24)
