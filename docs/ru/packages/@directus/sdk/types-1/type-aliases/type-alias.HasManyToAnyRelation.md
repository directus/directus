---
editLink: false
---

# Type alias: HasManyToAnyRelation`<Item>`

> **HasManyToAnyRelation**: \<`Item`\> [`UnpackList`](type-alias.UnpackList.md)\< `Item` \> _extends_ infer TItem ?
> `TItem` _extends_ `object` ? `"collection"` _extends_ _keyof_ `TItem` ? `"item"` _extends_ _keyof_ `TItem` ? `true` :
> `never` : `never` : `never` : `never`

Determine whether a field definition has a many-to-any relation TODO try making this dynamic somehow instead of relying
on "item" as key

## Type parameters

| Parameter |
| :-------- |
| `Item`    |

## Source

[types/fields.ts:57](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/fields.ts#L57)
