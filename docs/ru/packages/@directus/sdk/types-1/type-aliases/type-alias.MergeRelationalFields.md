---
editLink: false
---

# Type alias: MergeRelationalFields`<FieldList>`

> **MergeRelationalFields**: \<`FieldList`\> `Exclude`\< [`UnpackList`](type-alias.UnpackList.md)\< `FieldList` \>,
> `string` \> _extends_ infer RelatedFields ?
> `{ [Key in RelatedFields extends any ? keyof RelatedFields : never]-?: Exclude<RelatedFields[Key], undefined> }` :
> `never`

Merge union of optional objects

## Type parameters

| Parameter   |
| :---------- |
| `FieldList` |

## Source

[types/query.ts:35](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/query.ts#L35)
