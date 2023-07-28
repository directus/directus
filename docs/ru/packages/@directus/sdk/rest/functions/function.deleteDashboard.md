---
editLink: false
---

# Function: deleteDashboard()

> **deleteDashboard**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete an existing dashboard.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                                   |
| :-------- | :----------------------------------------------------------------------------------------------------- |
| `key`     | [`DirectusDashboard`](../../schema/type-aliases/type-alias.DirectusDashboard.md)\< `Schema` \>[`"id"`] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/dashboards.ts:24](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/dashboards.ts#L24)
