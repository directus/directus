---
editLink: false
---

# Function: deleteRole()

> **deleteRole**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete an existing role.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                         |
| :-------- | :------------------------------------------------------------------------------------------- |
| `key`     | [`DirectusRole`](../../schema/type-aliases/type-alias.DirectusRole.md)\< `Schema` \>[`"id"`] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/roles.ts:24](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/roles.ts#L24)
