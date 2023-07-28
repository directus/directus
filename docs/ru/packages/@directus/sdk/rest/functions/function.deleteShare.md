---
editLink: false
---

# Function: deleteShare()

> **deleteShare**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete an existing share.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                           |
| :-------- | :--------------------------------------------------------------------------------------------- |
| `key`     | [`DirectusShare`](../../schema/type-aliases/type-alias.DirectusShare.md)\< `Schema` \>[`"id"`] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/shares.ts:24](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/shares.ts#L24)
