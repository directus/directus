---
editLink: false
---

# Type alias: DirectusSettings`<Schema>`

> **DirectusSettings**: \<`Schema`\>
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_settings"`, \{`auth_login_attempts`: `number`; `auth_password_policy`: `string` \| `null`; `basemaps`:
> `Record`\< `string`, `any` \> \| `null`; `custom_aspect_ratios`: `Record`\< `string`, `any` \> \| `null`;
> `custom_css`: `string` \| `null`; `default_language`: `string`; `id`: `1`; `mapbox_key`: `string` \| `null`;
> `module_bar`: `any` \| `null`; `project_color`: `string` \| `null`; `project_descriptor`: `string` \| `null`;
> `project_logo`: `string` \| `null`; `project_name`: `string`; `project_url`: `string`; `public_background`: `string`
> \| `null`; `public_foreground`: `string` \| `null`; `public_note`: `string` \| `null`; `storage_asset_presets`:
> \{`fit`: `string`; `height`: `number`; `key`: `string`; `quality`: `number`; `width`: `number`; `withoutEnlargement`:
> `boolean`;}[] \| `null`; `storage_asset_transform`: `"all"` \| `"none"` \| `"presets"`; `storage_default_folder`:
> [`DirectusFolder`](type-alias.DirectusFolder.md)\< `Schema` \> \| `string` \| `null`;} \>

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Source

[schema/settings.ts:4](https://github.com/directus/directus/blob/7789a6c53/sdk/src/schema/settings.ts#L4)
