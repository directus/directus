---
editLink: false
---

# Function: createDirectus()

> **createDirectus**\<`Schema`\>(`url`): [`DirectusClient`](../../types-1/interfaces/interface.DirectusClient.md)\<
> `Schema` \>

Creates a client to communicate with a Directus app.

## Type parameters

| Parameter                   | Default |
| :-------------------------- | :------ |
| `Schema` _extends_ `object` | `any`   |

## Parameters

| Parameter | Type     | Description                  |
| :-------- | :------- | :--------------------------- |
| `url`     | `string` | The URL to the Directus app. |

## Returns

[`DirectusClient`](../../types-1/interfaces/interface.DirectusClient.md)\< `Schema` \>

A Directus client.

## Source

[client.ts:11](https://github.com/directus/directus/blob/7789a6c53/sdk/src/client.ts#L11)
