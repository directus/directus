---
editLink: false
---

# Function: logout()

> **logout**\<`Schema`\>(`refresh_token`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Invalidate the refresh token thus destroying the user's session.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter       | Type     | Description                                                                                                                       |
| :-------------- | :------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| `refresh_token` | `string` | The refresh token to invalidate. If you have the refresh token in a cookie through /auth/login, you don't have to submit it here. |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Empty body.

## Source

[rest/commands/auth/logout.ts:11](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/auth/logout.ts#L11)
