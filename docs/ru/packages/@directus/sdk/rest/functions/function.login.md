---
editLink: false
---

# Function: login()

> **login**\<`Schema`\>( `email`, `password`, `options` = `{}`):
> [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`AuthenticationData`](../../auth/interfaces/interface.AuthenticationData.md), `Schema` \>

Retrieve a temporary access token and refresh token.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter  | Type                                                      | Description                                                       |
| :--------- | :-------------------------------------------------------- | :---------------------------------------------------------------- |
| `email`    | `string`                                                  | Email address of the user you're retrieving the access token for. |
| `password` | `string`                                                  | Password of the user.                                             |
| `options`  | [`loginOptions`](../interfaces/interface.loginOptions.md) | Optional login settings                                           |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\<
[`AuthenticationData`](../../auth/interfaces/interface.AuthenticationData.md), `Schema` \>

The access and refresh tokens for the session

## Source

[rest/commands/auth/login.ts:20](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/auth/login.ts#L20)
