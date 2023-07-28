---
editLink: false
---

# Type alias: FieldsWildcard`<Item, Fields>`

> **FieldsWildcard**: \<`Item`, `Fields`\> [`UnpackList`](type-alias.UnpackList.md)\< `Fields` \> _extends_ infer Field
> ? `Field` _extends_ `undefined` ? _keyof_ `Item` : `Field` _extends_ `"*"` ? _keyof_ `Item` : `Field` _extends_
> `string` ? `Field` : `never` : `never`

Return all keys if Fields is undefined or contains '\*'

## Type parameters

| Parameter                 |
| :------------------------ |
| `Item` _extends_ `object` |
| `Fields`                  |

## Source

[types/fields.ts:79](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/fields.ts#L79)
