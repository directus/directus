---
editLink: false
---

# Type alias: DirectusPanel`<Schema>`

> **DirectusPanel**: \<`Schema`\>
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_panels"`,
> \{`color`: `string` \| `null`; `dashboard`: [`DirectusDashboard`](type-alias.DirectusDashboard.md)\< `Schema` \> \|
> `string`; `date_created`: `string` \| `null`; `height`: `number`; `icon`: `string` \| `null`; `id`: `string`; `name`:
> `string` \| `null`; `note`: `string` \| `null`; `options`: `Record`\< `string`, `any` \> \| `null`; `position_x`:
> `number`; `position_y`: `number`; `show_header`: `boolean`; `type`: `string`; `user_created`:
> [`DirectusUser`](type-alias.DirectusUser.md)\< `Schema` \> \| `string` \| `null`; `width`: `number`;} \>

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Source

[schema/panel.ts:5](https://github.com/directus/directus/blob/7789a6c53/sdk/src/schema/panel.ts#L5)
