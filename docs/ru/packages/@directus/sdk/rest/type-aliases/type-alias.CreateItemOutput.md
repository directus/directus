---
editLink: false
---

# Type alias: CreateItemOutput`<Schema, Collection, TQuery>`

> **CreateItemOutput**: \<`Schema`, `Collection`, `TQuery`\>
> [`ApplyQueryFields`](../../types-1/type-aliases/type-alias.ApplyQueryFields.md)\< `Schema`,
> [`CollectionType`](../../types-1/type-aliases/type-alias.CollectionType.md)\< `Schema`, `Collection` \>,
> `TQuery`[`"fields"`] \>

## Type parameters

| Parameter                                                                                                       |
| :-------------------------------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                                     |
| `Collection` _extends_ _keyof_ `Schema`                                                                         |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, `Schema`[`Collection`] \> |

## Source

[rest/commands/create/items.ts:4](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/create/items.ts#L4)
