---
editLink: false
---

# Type alias: CollectionType`<Schema, Collection>`

> **CollectionType**: \<`Schema`, `Collection`\> [`IfAny`](type-alias.IfAny.md)\< `Schema`, `any`, `Collection`
> _extends_ _keyof_ `Schema` ? [`UnpackList`](type-alias.UnpackList.md)\< `Schema`[`Collection`] \> _extends_ `object` ?
> [`UnpackList`](type-alias.UnpackList.md)\< `Schema`[`Collection`] \> : `never` : `never` \>

Return singular collection type

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |
| `Collection`                |

## Source

[types/schema.ts:16](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/schema.ts#L16)
