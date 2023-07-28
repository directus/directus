---
editLink: false
---

# Function: staticToken()

> **staticToken**(`access_token`): \<Schema\>(`_client`) =>
> [`StaticTokenClient`](../interfaces/interface.StaticTokenClient.md)\< `Schema` \>

Creates a client to authenticate with Directus using a static token.

## Parameters

| Parameter      | Type     |
| :------------- | :------- |
| `access_token` | `string` |

## Returns

A Directus static token client.

> > \<`Schema`\>(`_client`): [`StaticTokenClient`](../interfaces/interface.StaticTokenClient.md)\< `Schema` \>
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
> | `_client` | [`DirectusClient`](../../types-1/interfaces/interface.DirectusClient.md)\< `Schema` \> |
>
> ### Returns
>
> [`StaticTokenClient`](../interfaces/interface.StaticTokenClient.md)\< `Schema` \>
>
> ### Source
>
> [auth/static.ts:12](https://github.com/directus/directus/blob/7789a6c53/sdk/src/auth/static.ts#L12)

## Source

[auth/static.ts:11](https://github.com/directus/directus/blob/7789a6c53/sdk/src/auth/static.ts#L11)
