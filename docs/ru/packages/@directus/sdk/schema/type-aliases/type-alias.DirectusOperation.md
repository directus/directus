---
editLink: false
---

# Type alias: DirectusOperation`<Schema>`

> **DirectusOperation**: \<`Schema`\>
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_operations"`, \{`date_created`: `string` \| `null`; `flow`: [`DirectusFlow`](type-alias.DirectusFlow.md)\<
> `Schema` \> \| `string`; `id`: `string`; `key`: `string`; `name`: `string` \| `null`; `options`: `Record`\< `string`,
> `any` \> \| `null`; `position_x`: `number`; `position_y`: `number`; `reject`:
> [`DirectusOperation`](type-alias.DirectusOperation.md)\< `Schema` \> \| `string` \| `null`; `resolve`:
> [`DirectusOperation`](type-alias.DirectusOperation.md)\< `Schema` \> \| `string` \| `null`; `timestamp`: `string`;
> `type`: `string`; `user_created`: [`DirectusUser`](type-alias.DirectusUser.md)\< `Schema` \> \| `string` \| `null`;}
> \>

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Source

[schema/operation.ts:5](https://github.com/directus/directus/blob/7789a6c53/sdk/src/schema/operation.ts#L5)
