---
editLink: false
---

# Function: passwordRequest()

> **passwordRequest**\<`Schema`\>(`email`, `reset_url`?): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> `void`, `Schema` \>

Request a password reset email to be sent to the given user.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter    | Type     | Description                                                                                                         |
| :----------- | :------- | :------------------------------------------------------------------------------------------------------------------ |
| `email`      | `string` | Email address of the user you're requesting a password reset for.                                                   |
| `reset_url`? | `string` | Provide a custom reset url which the link in the email will lead to. The reset token will be passed as a parameter. |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Empty body.

## Source

[rest/commands/auth/password-request.ts:12](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/auth/password-request.ts#L12)
