---
editLink: false
---

# Function: generateTwoFactorSecret()

> **generateTwoFactorSecret**\<`Schema`\>(`password`): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> \{`otpauth_url`: `string`; `secret`: `string`;}, `Schema` \>

Generates a secret and returns the URL to be used in an authenticator app.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter  | Type     | Description          |
| :--------- | :------- | :------------------- |
| `password` | `string` | The user's password. |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< \{`otpauth_url`: `string`; `secret`: `string`;}, `Schema` \>

A two-factor secret

## Source

[rest/commands/utils/users.ts:53](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/utils/users.ts#L53)
