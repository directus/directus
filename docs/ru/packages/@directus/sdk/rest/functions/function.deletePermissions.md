---
editLink: false
---

# Function: deletePermissions()

> **deletePermissions**\<`Schema`\>(`keys`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema`
> \>

Delete multiple existing permissions rules

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                                       |
| :-------- | :--------------------------------------------------------------------------------------------------------- |
| `keys`    | [`DirectusPermission`](../../schema/type-aliases/type-alias.DirectusPermission.md)\< `Schema` \>[`"id"`][] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/permissions.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/permissions.ts#L10)
