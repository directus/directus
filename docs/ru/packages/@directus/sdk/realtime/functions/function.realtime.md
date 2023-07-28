---
editLink: false
---

# Function: realtime()

> **realtime**(`config` = `{}`): \<Schema\>(`client`) =>
> [`WebSocketClient`](../interfaces/interface.WebSocketClient.md)\< `Schema` \>

Creates a client to communicate with a Directus REST WebSocket.

## Parameters

| Parameter | Type                                                            | Description                 |
| :-------- | :-------------------------------------------------------------- | :-------------------------- |
| `config`  | [`WebSocketConfig`](../interfaces/interface.WebSocketConfig.md) | The optional configuration. |

## Returns

A Directus realtime client.

> > \<`Schema`\>(`client`): [`WebSocketClient`](../interfaces/interface.WebSocketClient.md)\< `Schema` \>
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
> [`WebSocketClient`](../interfaces/interface.WebSocketClient.md)\< `Schema` \>
>
> ### Source
>
> [realtime/composable.ts:37](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/composable.ts#L37)

## Source

[realtime/composable.ts:36](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/composable.ts#L36)
