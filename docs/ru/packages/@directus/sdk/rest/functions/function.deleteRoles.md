---
editLink: false
---

# Function: deleteRoles()

> **deleteRoles**\<`Schema`\>(`keys`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete multiple existing roles.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                           |
| :-------- | :--------------------------------------------------------------------------------------------- |
| `keys`    | [`DirectusRole`](../../schema/type-aliases/type-alias.DirectusRole.md)\< `Schema` \>[`"id"`][] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/roles.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/roles.ts#L10)
