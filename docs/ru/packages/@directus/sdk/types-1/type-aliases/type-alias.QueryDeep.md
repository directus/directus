---
editLink: false
---

# Type alias: QueryDeep`<Schema, Item>`

> **QueryDeep**: \<`Schema`, `Item`\> [`UnpackList`](type-alias.UnpackList.md)\< `Item` \> _extends_ infer FlatItem ?
> [`RelationalFields`](type-alias.RelationalFields.md)\< `Schema`, `FlatItem` \> _extends_ `never` ? `never` : \{ [Field
> in RelationalFields\<Schema, FlatItem\>]?: Query\<Schema, FlatItem[Field]\> extends infer TQuery ?
> MergeObjects\<QueryDeep\<Schema, FlatItem[Field]\>, \{ [Key in keyof Omit\<TQuery, "deep" \| "alias"\> as
> \`\_$\{string & Key}\`]: TQuery[Key] }\> : never } : `never`

Deep filter object

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |
| `Item`                      |

## Source

[types/query.ts:107](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/query.ts#L107)
