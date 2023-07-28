---
editLink: false
---

# Function: deleteFolder()

> **deleteFolder**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete multiple existing folders.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                             |
| :-------- | :----------------------------------------------------------------------------------------------- |
| `key`     | [`DirectusFolder`](../../schema/type-aliases/type-alias.DirectusFolder.md)\< `Schema` \>[`"id"`] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/folders.ts:24](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/folders.ts#L24)
