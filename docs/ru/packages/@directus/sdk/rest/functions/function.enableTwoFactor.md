---
editLink: false
---

# Function: enableTwoFactor()

> **enableTwoFactor**\<`Schema`\>(`secret`, `otp`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`,
> `Schema` \>

Adds a TFA secret to the user account.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type     | Description                                                                   |
| :-------- | :------- | :---------------------------------------------------------------------------- |
| `secret`  | `string` | The TFA secret from tfa/generate.                                             |
| `otp`     | `string` | OTP generated with the secret, to recheck if the user has a correct TFA setup |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Nothing

## Source

[rest/commands/utils/users.ts:71](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/utils/users.ts#L71)
