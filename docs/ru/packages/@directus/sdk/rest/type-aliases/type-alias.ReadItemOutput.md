---
editLink: false
---

# Type alias: ReadItemOutput`<Schema, Collection, TQuery>`

> **ReadItemOutput**: \<`Schema`, `Collection`, `TQuery`\>
> [`ApplyQueryFields`](../../types-1/type-aliases/type-alias.ApplyQueryFields.md)\< `Schema`,
> [`CollectionType`](../../types-1/type-aliases/type-alias.CollectionType.md)\< `Schema`, `Collection` \>,
> `TQuery`[`"fields"`] \>

## Type parameters

| Parameter                                                                                                                                                                                        |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                                                                                                                      |
| `Collection` _extends_ [`RegularCollections`](../../types-1/type-aliases/type-alias.RegularCollections.md)\< `Schema` \>                                                                         |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, [`CollectionType`](../../types-1/type-aliases/type-alias.CollectionType.md)\< `Schema`, `Collection` \> \> |

## Source

[rest/commands/read/items.ts:5](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/items.ts#L5)
