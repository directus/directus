---
editLink: false
---

# Function: passwordReset()

> **passwordReset**\<`Schema`\>(`token`, `password`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`,
> `Schema` \>

The request a password reset endpoint sends an email with a link to the admin app (or a custom route) which in turn uses
this endpoint to allow the user to reset their password.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter  | Type     | Description                                                                  |
| :--------- | :------- | :--------------------------------------------------------------------------- |
| `token`    | `string` | Password reset token, as provided in the email sent by the request endpoint. |
| `password` | `string` | New password for the user.                                                   |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Empty body.

## Source

[rest/commands/auth/password-reset.ts:12](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/auth/password-reset.ts#L12)
