---
editLink: false
---

# Type alias: DirectusFile`<Schema>`

> **DirectusFile**: \<`Schema`\> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\<
> `Schema`, `"directus_files"`, \{`charset`: `string` \| `null`; `description`: `string` \| `null`; `duration`: `number`
> \| `null`; `embed`: `unknown` \| `null`; `filename_disk`: `string` \| `null`; `filename_download`: `string`;
> `filesize`: `string` \| `null`; `folder`: [`DirectusFolder`](type-alias.DirectusFolder.md)\< `Schema` \> \| `string`
> \| `null`; `height`: `number` \| `null`; `id`: `string`; `location`: `string` \| `null`; `metadata`: `Record`\<
> `string`, `any` \> \| `null`; `modified_by`: [`DirectusUser`](type-alias.DirectusUser.md)\< `Schema` \> \| `string` \|
> `null`; `modified_on`: `string`; `storage`: `string`; `tags`: `string`[] \| `null`; `title`: `string` \| `null`;
> `type`: `string` \| `null`; `uploaded_by`: [`DirectusUser`](type-alias.DirectusUser.md)\< `Schema` \> \| `string` \|
> `null`; `uploaded_on`: `string`; `width`: `number` \| `null`;} \>

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Source

[schema/file.ts:6](https://github.com/directus/directus/blob/7789a6c53/sdk/src/schema/file.ts#L6)
