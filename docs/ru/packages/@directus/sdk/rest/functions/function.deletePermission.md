---
editLink: false
---

# Function: deletePermission()

> **deletePermission**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete an existing permissions rule

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                                     |
| :-------- | :------------------------------------------------------------------------------------------------------- |
| `key`     | [`DirectusPermission`](../../schema/type-aliases/type-alias.DirectusPermission.md)\< `Schema` \>[`"id"`] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/permissions.ts:24](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/permissions.ts#L24)
