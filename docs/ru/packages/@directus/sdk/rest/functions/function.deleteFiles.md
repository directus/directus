---
editLink: false
---

# Function: deleteFiles()

> **deleteFiles**\<`Schema`\>(`keys`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete multiple files at once.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                           |
| :-------- | :--------------------------------------------------------------------------------------------- |
| `keys`    | [`DirectusFile`](../../schema/type-aliases/type-alias.DirectusFile.md)\< `Schema` \>[`"id"`][] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/files.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/files.ts#L10)
