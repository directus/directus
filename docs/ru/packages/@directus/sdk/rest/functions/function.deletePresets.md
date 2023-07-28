---
editLink: false
---

# Function: deletePresets()

> **deletePresets**\<`Schema`\>(`keys`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete multiple existing presets.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                               |
| :-------- | :------------------------------------------------------------------------------------------------- |
| `keys`    | [`DirectusPreset`](../../schema/type-aliases/type-alias.DirectusPreset.md)\< `Schema` \>[`"id"`][] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/presets.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/presets.ts#L10)
