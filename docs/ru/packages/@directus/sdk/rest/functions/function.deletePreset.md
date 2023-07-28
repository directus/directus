---
editLink: false
---

# Function: deletePreset()

> **deletePreset**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete an existing preset.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                             |
| :-------- | :----------------------------------------------------------------------------------------------- |
| `key`     | [`DirectusPreset`](../../schema/type-aliases/type-alias.DirectusPreset.md)\< `Schema` \>[`"id"`] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/presets.ts:24](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/presets.ts#L24)
