---
editLink: false
---

# Type alias: MergeCoreCollection`<Schema, Collection, BuiltinCollection>`

> **MergeCoreCollection**: \<`Schema`, `Collection`, `BuiltinCollection`\> `Collection` _extends_ _keyof_ `Schema` ?
> [`UnpackList`](type-alias.UnpackList.md)\< `Schema`[`Collection`] \> _extends_ infer Item ?
> `{ [Field in Exclude<keyof Item, keyof BuiltinCollection>]: Item[Field] }` & `BuiltinCollection` : `never` :
> `BuiltinCollection`

Merge a core collection from the schema with the builtin schema

## Type parameters

| Parameter                                           |
| :-------------------------------------------------- |
| `Schema` _extends_ `object`                         |
| `Collection` _extends_ _keyof_ `Schema` \| `string` |
| `BuiltinCollection`                                 |

## Source

[types/schema.ts:66](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/schema.ts#L66)
