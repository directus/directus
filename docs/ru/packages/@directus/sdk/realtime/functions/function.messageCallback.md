---
editLink: false
---

# Function: messageCallback()

> **messageCallback**(`socket`): `Promise`\< `Record`\< `string`, `any` \> \| `MessageEvent`\< `string` \> \>

Wait for a websocket response

## Parameters

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `socket`  | `WebSocket` | WebSocket   |

## Returns

`Promise`\< `Record`\< `string`, `any` \> \| `MessageEvent`\< `string` \> \>

Incoming message object

## Source

[realtime/utils/message-callback.ts:12](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/utils/message-callback.ts#L12)
