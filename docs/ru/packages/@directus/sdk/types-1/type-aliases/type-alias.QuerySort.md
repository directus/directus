---
editLink: false
---

# Type alias: QuerySort`<_Schema, Item>`

> **QuerySort**: \<`_Schema`, `Item`\> [`UnpackList`](type-alias.UnpackList.md)\< `Item` \> _extends_ infer FlatItem ?
> \{ [Field in keyof FlatItem]: Field \| \`-$\{Field & string}\` }[*keyof* `FlatItem`] : `never`

Query sort TODO expand to relational sorting (same object notation as fields i guess)

## Type parameters

| Parameter                    |
| :--------------------------- |
| `_Schema` _extends_ `object` |
| `Item`                       |

## Source

[types/query.ts:98](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/query.ts#L98)
