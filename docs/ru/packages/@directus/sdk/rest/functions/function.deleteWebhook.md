---
editLink: false
---

# Function: deleteWebhook()

> **deleteWebhook**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete an existing webhook.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                               |
| :-------- | :------------------------------------------------------------------------------------------------- |
| `key`     | [`DirectusWebhook`](../../schema/type-aliases/type-alias.DirectusWebhook.md)\< `Schema` \>[`"id"`] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/webhooks.ts:24](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/webhooks.ts#L24)
