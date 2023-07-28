---
editLink: false
---

# Function: deleteFlows()

> **deleteFlows**\<`Schema`\>(`keys`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete multiple existing flows.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                           |
| :-------- | :--------------------------------------------------------------------------------------------- |
| `keys`    | [`DirectusFlow`](../../schema/type-aliases/type-alias.DirectusFlow.md)\< `Schema` \>[`"id"`][] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/flows.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/flows.ts#L10)
