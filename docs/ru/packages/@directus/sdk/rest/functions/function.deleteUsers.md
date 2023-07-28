---
editLink: false
---

# Function: deleteUsers()

> **deleteUsers**\<`Schema`\>(`keys`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete multiple existing users.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                           |
| :-------- | :--------------------------------------------------------------------------------------------- |
| `keys`    | [`DirectusUser`](../../schema/type-aliases/type-alias.DirectusUser.md)\< `Schema` \>[`"id"`][] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Nothing

## Source

[rest/commands/delete/users.ts:12](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/users.ts#L12)
