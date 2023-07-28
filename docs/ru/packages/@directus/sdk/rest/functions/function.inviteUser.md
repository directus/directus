---
editLink: false
---

# Function: inviteUser()

> **inviteUser**\<`Schema`\>( `email`, `role`, `invite_url`?): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> `void`, `Schema` \>

Invite a new user by email.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter     | Type     | Description                                                                                                           |
| :------------ | :------- | :-------------------------------------------------------------------------------------------------------------------- |
| `email`       | `string` | User email to invite.                                                                                                 |
| `role`        | `string` | Role of the new user.                                                                                                 |
| `invite_url`? | `string` | Provide a custom invite url which the link in the email will lead to. The invite token will be passed as a parameter. |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Nothing

## Source

[rest/commands/utils/users.ts:13](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/utils/users.ts#L13)
