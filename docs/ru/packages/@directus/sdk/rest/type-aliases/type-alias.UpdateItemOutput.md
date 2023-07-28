---
editLink: false
---

# Type alias: UpdateItemOutput`<Schema, Collection, TQuery>`

> **UpdateItemOutput**: \<`Schema`, `Collection`, `TQuery`\>
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

[rest/commands/update/items.ts:5](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/update/items.ts#L5)
