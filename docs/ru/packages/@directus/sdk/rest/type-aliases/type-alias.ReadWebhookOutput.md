---
editLink: false
---

# Type alias: ReadWebhookOutput`<Schema, TQuery, Item>`

> **ReadWebhookOutput**: \<`Schema`, `TQuery`, `Item`\>
> [`ApplyQueryFields`](../../types-1/type-aliases/type-alias.ApplyQueryFields.md)\< `Schema`, `Item`,
> `TQuery`[`"fields"`] \>

## Type parameters

| Parameter                                                                                       | Default                                                                                    |
| :---------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                     | -                                                                                          |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, `Item` \> | -                                                                                          |
| `Item` _extends_ `object`                                                                       | [`DirectusWebhook`](../../schema/type-aliases/type-alias.DirectusWebhook.md)\< `Schema` \> |

## Source

[rest/commands/read/webhooks.ts:5](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/webhooks.ts#L5)
