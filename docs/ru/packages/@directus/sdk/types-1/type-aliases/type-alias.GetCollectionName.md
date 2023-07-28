---
editLink: false
---

# Type alias: GetCollectionName`<Schema, Collection, FullSchema>`

> **GetCollectionName**: \<`Schema`, `Collection`, `FullSchema`\>
> `{ [K in keyof FullSchema]: UnpackList<FullSchema[K]> extends Collection ? K : never }`[*keyof* `FullSchema`]

Helper to extract a collection name

## Type parameters

| Parameter                       | Default                                                        |
| :------------------------------ | :------------------------------------------------------------- |
| `Schema` _extends_ `object`     | -                                                              |
| `Collection`                    | -                                                              |
| `FullSchema` _extends_ `object` | [`CompleteSchema`](type-alias.CompleteSchema.md)\< `Schema` \> |

## Source

[types/schema.ts:111](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/schema.ts#L111)
