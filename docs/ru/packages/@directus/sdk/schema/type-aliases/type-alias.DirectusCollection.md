---
editLink: false
---

# Type alias: DirectusCollection`<Schema>`

> **DirectusCollection**: \<`Schema`\> `object`

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Type declaration

### collection

**collection**: `string`

---

### meta

**meta**: [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
`"directus_collections"`, \{`accountability`: `string` \| `null`; `archive_app_filter`: `boolean`; `archive_field`:
`string` \| `null`; `archive_value`: `string` \| `null`; `collapse`: `string`; `collection`: `string`; `color`: `string`
\| `null`; `display_template`: `string` \| `null`; `group`: `string` \| `null`; `hidden`: `boolean`; `icon`: `string` \|
`null`; `item_duplication_fields`: `string`[] \| `null`; `note`: `string` \| `null`; `preview_url`: `string` \| `null`;
`singleton`: `boolean`; `sort`: `string` \| `null`; `sort_field`: `string` \| `null`; `translations`:
[`CollectionMetaTranslationType`](type-alias.CollectionMetaTranslationType.md)[] \| `null`; `unarchive_value`: `string`
\| `null`;} \>

---

### schema

**schema**: \{`comment`: `string` \| `null`; `name`: `string`; `schema`: `string`;} \| `null`

## Source

[schema/collection.ts:3](https://github.com/directus/directus/blob/7789a6c53/sdk/src/schema/collection.ts#L3)
