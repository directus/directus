---
editLink: false
---

# Function: authentication()

> **authentication**(`mode` = `'cookie'`, `config` = `{}`): \<Schema\>(`client`) =>
> [`AuthenticationClient`](../interfaces/interface.AuthenticationClient.md)\< `Schema` \>

Creates a client to authenticate with Directus.

## Parameters

| Parameter | Type                                                                      | Default value | Description                 |
| :-------- | :------------------------------------------------------------------------ | :------------ | :-------------------------- |
| `mode`    | [`AuthenticationMode`](../type-aliases/type-alias.AuthenticationMode.md)  | `'cookie'`    | AuthenticationMode          |
| `config`  | [`AuthenticationConfig`](../interfaces/interface.AuthenticationConfig.md) | `{}`          | The optional configuration. |

## Returns

A Directus authentication client.

> > \<`Schema`\>(`client`): [`AuthenticationClient`](../interfaces/interface.AuthenticationClient.md)\< `Schema` \>
>
> ### Type parameters
>
> | Parameter                   |
> | :-------------------------- |
> | `Schema` _extends_ `object` |
>
> ### Parameters
>
> | Parameter | Type                                                                                   |
> | :-------- | :------------------------------------------------------------------------------------- |
> | `client`  | [`DirectusClient`](../../types-1/interfaces/interface.DirectusClient.md)\< `Schema` \> |
>
> ### Returns
>
> [`AuthenticationClient`](../interfaces/interface.AuthenticationClient.md)\< `Schema` \>
>
> ### Source
>
> [auth/composable.ts:22](https://github.com/directus/directus/blob/7789a6c53/sdk/src/auth/composable.ts#L22)

## Source

[auth/composable.ts:21](https://github.com/directus/directus/blob/7789a6c53/sdk/src/auth/composable.ts#L21)
