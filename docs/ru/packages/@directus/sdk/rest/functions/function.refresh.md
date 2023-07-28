---
editLink: false
---

# Function: refresh()

> **refresh**\<`Schema`\>(`refresh_token`, `mode` = `'json'`): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`AuthenticationData`](../../auth/interfaces/interface.AuthenticationData.md), `Schema` \>

Retrieve a new access token using a refresh token.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter       | Type                                                                             | Default value | Description                                                                                                                |
| :-------------- | :------------------------------------------------------------------------------- | :------------ | :------------------------------------------------------------------------------------------------------------------------- |
| `refresh_token` | `string`                                                                         | `undefined`   | The refresh token to use. If you have the refresh token in a cookie through /auth/login, you don't have to submit it here. |
| `mode`          | [`AuthenticationMode`](../../auth/type-aliases/type-alias.AuthenticationMode.md) | `'json'`      | Whether to retrieve the refresh token in the JSON response, or in a httpOnly secure cookie. One of json, cookie.           |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\<
[`AuthenticationData`](../../auth/interfaces/interface.AuthenticationData.md), `Schema` \>

The new access and refresh tokens for the session.

## Source

[rest/commands/auth/refresh.ts:13](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/auth/refresh.ts#L13)
