---
editLink: false
---

# Function: rest()

> **rest**(`config` = `{}`): \<Schema\>(`client`) => [`RestClient`](../interfaces/interface.RestClient.md)\< `Schema` \>

Creates a client to communicate with the Directus REST API.

## Parameters

| Parameter | Type                                                  |
| :-------- | :---------------------------------------------------- |
| `config`  | [`RestConfig`](../interfaces/interface.RestConfig.md) |

## Returns

A Directus REST client.

> > \<`Schema`\>(`client`): [`RestClient`](../interfaces/interface.RestClient.md)\< `Schema` \>
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
> [`RestClient`](../interfaces/interface.RestClient.md)\< `Schema` \>
>
> ### Source
>
> [rest/composable.ts:14](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/composable.ts#L14)

## Source

[rest/composable.ts:13](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/composable.ts#L13)
