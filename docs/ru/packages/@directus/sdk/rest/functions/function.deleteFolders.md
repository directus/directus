---
editLink: false
---

# Function: deleteFolders()

> **deleteFolders**\<`Schema`\>(`keys`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete multiple existing folders.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                               |
| :-------- | :------------------------------------------------------------------------------------------------- |
| `keys`    | [`DirectusFolder`](../../schema/type-aliases/type-alias.DirectusFolder.md)\< `Schema` \>[`"id"`][] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/folders.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/folders.ts#L10)
