---
editLink: false
---

# Type alias: DirectusActivity`<Schema>`

> **DirectusActivity**: \<`Schema`\>
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_activity"`, \{`action`: `string`; `collection`: `string`; `comment`: `string` \| `null`; `id`: `number`;
> `ip`: `string` \| `null`; `item`: `string`; `origin`: `string` \| `null`; `revisions`:
> [`DirectusRevision`](type-alias.DirectusRevision.md)\< `Schema` \>[] \| `number`[] \| `null`; `timestamp`: `string`;
> `user`: [`DirectusUser`](type-alias.DirectusUser.md)\< `Schema` \> \| `string` \| `null`; `user_agent`: `string` \|
> `null`;} \>

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Source

[schema/activity.ts:5](https://github.com/directus/directus/blob/7789a6c53/sdk/src/schema/activity.ts#L5)
