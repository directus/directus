---
editLink: false
---

# Type alias: SubscriptionOutput`<Schema, Collection, TQuery, Events, TItem>`

> **SubscriptionOutput**: \<`Schema`, `Collection`, `TQuery`, `Events`, `TItem`\> \{`type`: `"subscription"`;} &
> `{ [Event in Events]: SubscriptionPayload<TItem>[Event] }`[`Events`]

> ## SubscriptionOutput.type
>
> **type**: `"subscription"`

## Type parameters

| Parameter                                                                                                                      | Default                                                                                                                                                                                                                                                                                                                                                                                |
| :----------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                                                    | -                                                                                                                                                                                                                                                                                                                                                                                      |
| `Collection` _extends_ _keyof_ `Schema`                                                                                        | -                                                                                                                                                                                                                                                                                                                                                                                      |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, `Schema`[`Collection`] \> \| `undefined` | -                                                                                                                                                                                                                                                                                                                                                                                      |
| `Events` _extends_ [`SubscriptionEvents`](type-alias.SubscriptionEvents.md)                                                    | -                                                                                                                                                                                                                                                                                                                                                                                      |
| `TItem`                                                                                                                        | `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, `Schema`[`Collection`] \> ? [`ApplyQueryFields`](../../types-1/type-aliases/type-alias.ApplyQueryFields.md)\< `Schema`, [`CollectionType`](../../types-1/type-aliases/type-alias.CollectionType.md)\< `Schema`, `Collection` \>, `TQuery`[`"fields"`] \> : `Partial`\< `Schema`[`Collection`] \> |

## Source

[realtime/types.ts:60](https://github.com/directus/directus/blob/7789a6c53/sdk/src/realtime/types.ts#L60)
