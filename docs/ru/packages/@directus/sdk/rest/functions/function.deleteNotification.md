---
editLink: false
---

# Function: deleteNotification()

> **deleteNotification**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema`
> \>

Delete an existing notification.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                                         |
| :-------- | :----------------------------------------------------------------------------------------------------------- |
| `key`     | [`DirectusNotification`](../../schema/type-aliases/type-alias.DirectusNotification.md)\< `Schema` \>[`"id"`] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/notifications.ts:24](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/notifications.ts#L24)
