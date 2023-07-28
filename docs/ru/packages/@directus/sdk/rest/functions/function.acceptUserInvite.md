---
editLink: false
---

# Function: acceptUserInvite()

> **acceptUserInvite**\<`Schema`\>(`token`, `password`): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> `void`, `Schema` \>

Accept your invite. The invite user endpoint sends the email a link to the Admin App.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter  | Type     | Description            |
| :--------- | :------- | :--------------------- |
| `token`    | `string` | Accept invite token.   |
| `password` | `string` | Password for the user. |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Nothing

## Source

[rest/commands/utils/users.ts:34](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/utils/users.ts#L34)
