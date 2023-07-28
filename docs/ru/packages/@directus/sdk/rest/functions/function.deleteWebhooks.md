---
editLink: false
---

# Function: deleteWebhooks()

> **deleteWebhooks**\<`Schema`\>(`keys`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete multiple existing webhooks.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                                 |
| :-------- | :--------------------------------------------------------------------------------------------------- |
| `keys`    | [`DirectusWebhook`](../../schema/type-aliases/type-alias.DirectusWebhook.md)\< `Schema` \>[`"id"`][] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/webhooks.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/webhooks.ts#L10)
