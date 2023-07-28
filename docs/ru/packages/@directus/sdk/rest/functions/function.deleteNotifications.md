---
editLink: false
---

# Function: deleteNotifications()

> **deleteNotifications**\<`Schema`\>(`keys`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`,
> `Schema` \>

Delete multiple existing notifications.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                                           |
| :-------- | :------------------------------------------------------------------------------------------------------------- |
| `keys`    | [`DirectusNotification`](../../schema/type-aliases/type-alias.DirectusNotification.md)\< `Schema` \>[`"id"`][] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/notifications.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/notifications.ts#L10)
