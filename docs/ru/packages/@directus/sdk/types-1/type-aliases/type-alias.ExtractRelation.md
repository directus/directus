---
editLink: false
---

# Type alias: ExtractRelation`<Schema, Item, Key>`

> **ExtractRelation**: \<`Schema`, `Item`, `Key`\> `Key` _extends_ _keyof_ `Item` ?
> [`ExtractItem`](type-alias.ExtractItem.md)\< `Schema`, `Item`[`Key`] \> : `never`

Returns the relation type from the current item by key

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |
| `Item` _extends_ `object`   |
| `Key`                       |

## Source

[types/query.ts:28](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/query.ts#L28)
