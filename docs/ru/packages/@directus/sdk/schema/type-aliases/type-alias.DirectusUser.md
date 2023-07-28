---
editLink: false
---

# Type alias: DirectusUser`<Schema>`

> **DirectusUser**: \<`Schema`\> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\<
> `Schema`, `"directus_users"`, \{`auth_data`: `Record`\< `string`, `any` \> \| `null`; `avatar`:
> [`DirectusFile`](type-alias.DirectusFile.md)\< `Schema` \> \| `string` \| `null`; `description`: `string` \| `null`;
> `email`: `string` \| `null`; `email_notifications`: `boolean` \| `null`; `external_identifier`: `string` \| `null`;
> `first_name`: `string` \| `null`; `id`: `string`; `language`: `string` \| `null`; `last_access`: `string` \| `null`;
> `last_name`: `string` \| `null`; `last_page`: `string` \| `null`; `location`: `string` \| `null`; `password`: `string`
> \| `null`; `provider`: `string`; `role`: `string` \| `null`; `status`: `string`; `tags`: `string`[] \| `null`;
> `tfa_secret`: `string` \| `null`; `theme`: `string` \| `null`; `title`: `string` \| `null`; `token`: `string` \|
> `null`;} \>

directus_users type

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Source

[schema/user.ts:7](https://github.com/directus/directus/blob/7789a6c53/sdk/src/schema/user.ts#L7)
