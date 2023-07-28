---
editLink: false
---

# Function: deleteFile()

> **deleteFile**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete an existing file.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                         |
| :-------- | :------------------------------------------------------------------------------------------- |
| `key`     | [`DirectusFile`](../../schema/type-aliases/type-alias.DirectusFile.md)\< `Schema` \>[`"id"`] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/files.ts:24](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/files.ts#L24)
