---
editLink: false
---

# Type alias: CreateUserOutput`<Schema, TQuery, Item>`

> **CreateUserOutput**: \<`Schema`, `TQuery`, `Item`\>
> [`ApplyQueryFields`](../../types-1/type-aliases/type-alias.ApplyQueryFields.md)\< `Schema`, `Item`,
> `TQuery`[`"fields"`] \>

## Type parameters

| Parameter                                                                                       | Default                                                                              |
| :---------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                     | -                                                                                    |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, `Item` \> | -                                                                                    |
| `Item` _extends_ `object`                                                                       | [`DirectusUser`](../../schema/type-aliases/type-alias.DirectusUser.md)\< `Schema` \> |

## Source

[rest/commands/create/users.ts:5](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/create/users.ts#L5)
