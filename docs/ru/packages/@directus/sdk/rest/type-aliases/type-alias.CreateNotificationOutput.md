---
editLink: false
---

# Type alias: CreateNotificationOutput`<Schema, TQuery, Item>`

> **CreateNotificationOutput**: \<`Schema`, `TQuery`, `Item`\>
> [`ApplyQueryFields`](../../types-1/type-aliases/type-alias.ApplyQueryFields.md)\< `Schema`, `Item`,
> `TQuery`[`"fields"`] \>

## Type parameters

| Parameter                                                                                       | Default                                                                                              |
| :---------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                     | -                                                                                                    |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, `Item` \> | -                                                                                                    |
| `Item` _extends_ `object`                                                                       | [`DirectusNotification`](../../schema/type-aliases/type-alias.DirectusNotification.md)\< `Schema` \> |

## Source

[rest/commands/create/notifications.ts:5](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/create/notifications.ts#L5)
