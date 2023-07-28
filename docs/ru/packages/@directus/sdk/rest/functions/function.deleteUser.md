---
editLink: false
---

# Function: deleteUser()

> **deleteUser**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete an existing user.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                         | Description                 |
| :-------- | :------------------------------------------------------------------------------------------- | :-------------------------- |
| `key`     | [`DirectusUser`](../../schema/type-aliases/type-alias.DirectusUser.md)\< `Schema` \>[`"id"`] | The primary key of the item |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Nothing

## Source

[rest/commands/delete/users.ts:28](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/users.ts#L28)
