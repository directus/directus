---
editLink: false
---

# Type alias: QueryFilter`<Schema, Item>`

> **QueryFilter**: \<`Schema`, `Item`\> [`UnpackList`](type-alias.UnpackList.md)\< `Item` \> _extends_ infer FlatItem ?
> \{ [Field in keyof FlatItem]?: (Field extends RelationalFields\<Schema, FlatItem\> ? QueryFilter\<Schema,
> FlatItem[Field]\> : never) \| FilterOperatorsByType\<FlatItem[Field]\> } : `never`

Filters

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |
| `Item`                      |

## Source

[types/query.ts:51](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/query.ts#L51)
