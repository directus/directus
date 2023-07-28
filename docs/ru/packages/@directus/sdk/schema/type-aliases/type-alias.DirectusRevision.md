---
editLink: false
---

# Type alias: DirectusRevision`<Schema>`

> **DirectusRevision**: \<`Schema`\>
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_revisions"`, \{`activity`: [`DirectusActivity`](type-alias.DirectusActivity.md)\< `Schema` \> \| `number`;
> `collection`: `string`; `data`: `Record`\< `string`, `any` \> \| `null`; `delta`: `Record`\< `string`, `any` \> \|
> `null`; `id`: `number`; `item`: `string`; `parent`: [`DirectusRevision`](type-alias.DirectusRevision.md)\< `Schema` \>
> \| `number` \| `null`;} \>

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Source

[schema/revision.ts:4](https://github.com/directus/directus/blob/7789a6c53/sdk/src/schema/revision.ts#L4)
