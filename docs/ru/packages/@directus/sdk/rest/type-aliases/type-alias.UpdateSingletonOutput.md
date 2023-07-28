---
editLink: false
---

# Type alias: UpdateSingletonOutput`<Schema, Collection, TQuery>`

> **UpdateSingletonOutput**: \<`Schema`, `Collection`, `TQuery`\>
> [`ApplyQueryFields`](../../types-1/type-aliases/type-alias.ApplyQueryFields.md)\< `Schema`,
> [`CollectionType`](../../types-1/type-aliases/type-alias.CollectionType.md)\< `Schema`, `Collection` \>,
> `TQuery`[`"fields"`] \>

## Type parameters

| Parameter                                                                                                                    |
| :--------------------------------------------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                                                  |
| `Collection` _extends_ [`SingletonCollections`](../../types-1/type-aliases/type-alias.SingletonCollections.md)\< `Schema` \> |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, `Schema`[`Collection`] \>              |

## Source

[rest/commands/update/singleton.ts:4](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/update/singleton.ts#L4)
