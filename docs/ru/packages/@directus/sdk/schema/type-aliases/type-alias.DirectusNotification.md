---
editLink: false
---

# Type alias: DirectusNotification`<Schema>`

> **DirectusNotification**: \<`Schema`\>
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_notifications"`, \{`collection`: `string` \| `null`; `id`: `string`; `item`: `string` \| `null`; `message`:
> `string` \| `null`; `recipient`: [`DirectusUser`](type-alias.DirectusUser.md)\< `Schema` \> \| `string`; `sender`:
> [`DirectusUser`](type-alias.DirectusUser.md)\< `Schema` \> \| `string` \| `null`; `status`: `string` \| `null`;
> `subject`: `string`; `timestamp`: `string` \| `null`;} \>

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Source

[schema/notification.ts:4](https://github.com/directus/directus/blob/7789a6c53/sdk/src/schema/notification.ts#L4)
