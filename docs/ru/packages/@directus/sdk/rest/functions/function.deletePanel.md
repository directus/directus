---
editLink: false
---

# Function: deletePanel()

> **deletePanel**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete an existing panel.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                           |
| :-------- | :--------------------------------------------------------------------------------------------- |
| `key`     | [`DirectusPanel`](../../schema/type-aliases/type-alias.DirectusPanel.md)\< `Schema` \>[`"id"`] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/panels.ts:24](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/panels.ts#L24)
