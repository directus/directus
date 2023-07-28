---
editLink: false
---

# Type alias: UpdatePermissionOutput`<Schema, TQuery, Item>`

> **UpdatePermissionOutput**: \<`Schema`, `TQuery`, `Item`\>
> [`ApplyQueryFields`](../../types-1/type-aliases/type-alias.ApplyQueryFields.md)\< `Schema`, `Item`,
> `TQuery`[`"fields"`] \>

## Type parameters

| Parameter                                                                                       | Default                                                                                          |
| :---------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                     | -                                                                                                |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, `Item` \> | -                                                                                                |
| `Item` _extends_ `object`                                                                       | [`DirectusPermission`](../../schema/type-aliases/type-alias.DirectusPermission.md)\< `Schema` \> |

## Source

[rest/commands/update/permissions.ts:5](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/update/permissions.ts#L5)
