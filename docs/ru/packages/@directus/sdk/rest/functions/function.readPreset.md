---
editLink: false
---

# Function: readPreset()

> **readPreset**\<`Schema`, `TQuery`\>(`key`, `query`?): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`, `any` \>,
> [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\<
> [`PickFlatFields`](../../types-1/type-aliases/type-alias.PickFlatFields.md)\< `Schema`,
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_presets"`, \{`bookmark`: `null` \| `string`; `collection`: `null` \| `string`; `color`: `null` \| `string`;
> `filter`: `null` \| `Record`\< `string`, `any` \>; `icon`: `null` \| `string`; `id`: `number`; `layout`: `null` \|
> `string`; `layout_options`: `null` \| `Record`\< `string`, `any` \>; `layout_query`: `null` \| `Record`\< `string`,
> `any` \>; `refresh_interval`: `null` \| `number`; `role`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_roles"`,
> \{`admin_access`: `boolean`; `app_access`: `boolean`; `description`: `null` \| `string`; `enforce_tfa`: `boolean`;
> `icon`: `string`; `id`: `string`; `ip_access`: `null` \| `string`; `name`: `string`;} \>; `search`: `null` \|
> `string`; `user`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_users"`,
> \{`auth_data`: `null` \| `Record`\< `string`, `any` \>; `avatar`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_files"`,
> \{`charset`: `null` \| `string`; `description`: `null` \| `string`; `duration`: `null` \| `number`; `embed`:
> `unknown`; `filename_disk`: `null` \| `string`; `filename_download`: `string`; `filesize`: `null` \| `string`;
> `folder`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_folders"`, \{`id`: `string`; `name`: `string`; `parent`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_folders"`,
> `{ id: string; name: string; parent: string | MergeCoreCollection<Schema, "directus_folders", ...> | null; }` \>;} \>;
> `height`: `null` \| `number`; `id`: `string`; `location`: `null` \| `string`; `metadata`: `null` \| `Record`\<
> `string`, `any` \>; `modified_by`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_users"`,
> `{ id: string; first_name: string | null; last_name: string | null; email: string | null; password: string | null; location: string | null; title: string | null; description: string | null; ... 13 more ...; email_notifications: boolean | null; }`
> \>; `modified_on`: `string`; `storage`: `string`; `tags`: `null` \| `string`[]; `title`: `null` \| `string`; `type`:
> `null` \| `string`; `uploaded_by`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_users"`,
> `{ id: string; first_name: string | null; last_name: string | null; email: string | null; password: string | null; location: string | null; title: string | null; description: string | null; ... 13 more ...; email_notifications: boolean | null; }`
> \>; `uploaded_on`: `string`; `width`: `null` \| `number`;} \>; `description`: `null` \| `string`; `email`: `null` \|
> `string`; `email_notifications`: `null` \| `boolean`; `external_identifier`: `null` \| `string`; `first_name`: `null`
> \| `string`; `id`: `string`; `language`: `null` \| `string`; `last_access`: `null` \| `string`; `last_name`: `null` \|
> `string`; `last_page`: `null` \| `string`; `location`: `null` \| `string`; `password`: `null` \| `string`; `provider`:
> `string`; `role`: `null` \| `string`; `status`: `string`; `tags`: `null` \| `string`[]; `tfa_secret`: `null` \|
> `string`; `theme`: `null` \| `string`; `title`: `null` \| `string`; `token`: `null` \| `string`;} \>;} \> \>,
> [`FieldsWildcard`](../../types-1/type-aliases/type-alias.FieldsWildcard.md)\<
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_presets"`, \{`bookmark`: `null` \| `string`; `collection`: `null` \| `string`; `color`: `null` \| `string`;
> `filter`: `null` \| `Record`\< `string`, `any` \>; `icon`: `null` \| `string`; `id`: `number`; `layout`: `null` \|
> `string`; `layout_options`: `null` \| `Record`\< `string`, `any` \>; `layout_query`: `null` \| `Record`\< `string`,
> `any` \>; `refresh_interval`: `null` \| `number`; `role`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_roles"`,
> \{`admin_access`: `boolean`; `app_access`: `boolean`; `description`: `null` \| `string`; `enforce_tfa`: `boolean`;
> `icon`: `string`; `id`: `string`; `ip_access`: `null` \| `string`; `name`: `string`;} \>; `search`: `null` \|
> `string`; `user`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_users"`,
> \{`auth_data`: `null` \| `Record`\< `string`, `any` \>; `avatar`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_files"`,
> \{`charset`: `null` \| `string`; `description`: `null` \| `string`; `duration`: `null` \| `number`; `embed`:
> `unknown`; `filename_disk`: `null` \| `string`; `filename_download`: `string`; `filesize`: `null` \| `string`;
> `folder`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_folders"`, \{`id`: `string`; `name`: `string`; `parent`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_folders"`,
> `{ id: string; name: string; parent: string | MergeCoreCollection<Schema, "directus_folders", ...> | null; }` \>;} \>;
> `height`: `null` \| `number`; `id`: `string`; `location`: `null` \| `string`; `metadata`: `null` \| `Record`\<
> `string`, `any` \>; `modified_by`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_users"`,
> `{ id: string; first_name: string | null; last_name: string | null; email: string | null; password: string | null; location: string | null; title: string | null; description: string | null; ... 13 more ...; email_notifications: boolean | null; }`
> \>; `modified_on`: `string`; `storage`: `string`; `tags`: `null` \| `string`[]; `title`: `null` \| `string`; `type`:
> `null` \| `string`; `uploaded_by`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_users"`,
> `{ id: string; first_name: string | null; last_name: string | null; email: string | null; password: string | null; location: string | null; title: string | null; description: string | null; ... 13 more ...; email_notifications: boolean | null; }`
> \>; `uploaded_on`: `string`; `width`: `null` \| `number`;} \>; `description`: `null` \| `string`; `email`: `null` \|
> `string`; `email_notifications`: `null` \| `boolean`; `external_identifier`: `null` \| `string`; `first_name`: `null`
> \| `string`; `id`: `string`; `language`: `null` \| `string`; `last_access`: `null` \| `string`; `last_name`: `null` \|
> `string`; `last_page`: `null` \| `string`; `location`: `null` \| `string`; `password`: `null` \| `string`; `provider`:
> `string`; `role`: `null` \| `string`; `status`: `string`; `tags`: `null` \| `string`[]; `tfa_secret`: `null` \|
> `string`; `theme`: `null` \| `string`; `title`: `null` \| `string`; `token`: `null` \| `string`;} \>;} \> \>,
> `Exclude`\< [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `TQuery`[`"fields"`] \> \>,
> [`PickRelationalFields`](../../types-1/type-aliases/type-alias.PickRelationalFields.md)\<
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `TQuery`[`"fields"`] \> \> \> _extends_ `never` ?
> `never` : _keyof_ [`PickRelationalFields`](../../types-1/type-aliases/type-alias.PickRelationalFields.md)\<
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `TQuery`[`"fields"`] \> \> \> \> \> \>,
> [`PickRelationalFields`](../../types-1/type-aliases/type-alias.PickRelationalFields.md)\<
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `TQuery`[`"fields"`] \> \> \> _extends_ `never` ?
> `never` : \{ [Field in string \| number \| symbol]: Field extends keyof UnpackList\<MergeCoreCollection\<Schema,
> "directus_presets", Object\>\> ? Extract\<UnpackList\<MergeCoreCollection\<Schema, "directus_presets",
> Object\>\>[Field], ItemType\<Schema\>\> extends RelatedCollection ?
> IsNullable\<UnpackList\<MergeCoreCollection\<Schema, "directus_presets", Object\>\>[Field], null \| (RelatedCollection
> extends any[] ? HasManyToAnyRelation\<RelatedCollection\> extends never ? null \| ApplyNestedQueryFields\<Schema,
> RelatedCollection, PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>[] :
> ApplyManyToAnyFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field], UnpackList\<RelatedCollection\>\>[] :
> ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>), RelatedCollection extends any[] ?
> HasManyToAnyRelation\<RelatedCollection\> extends never ? null \| ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>[] : ApplyManyToAnyFields\<Schema,
> RelatedCollection, PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field],
> UnpackList\<RelatedCollection\>\>[] : ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>\> : never : never } \> \>, `Schema` \>

List an existing preset by primary key.

## Type parameters

| Parameter                                                                                                                                                                         |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                                                                                                       |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, [`DirectusPreset`](../../schema/type-aliases/type-alias.DirectusPreset.md)\< `Schema` \> \> |

## Parameters

| Parameter | Type                                                                                             | Description                      |
| :-------- | :----------------------------------------------------------------------------------------------- | :------------------------------- |
| `key`     | [`DirectusPreset`](../../schema/type-aliases/type-alias.DirectusPreset.md)\< `Schema` \>[`"id"`] | The primary key of the dashboard |
| `query`?  | `TQuery`                                                                                         | The query parameters             |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
`Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\<
[`PickFlatFields`](../../types-1/type-aliases/type-alias.PickFlatFields.md)\< `Schema`,
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_presets"`,
\{`bookmark`: `null` \| `string`; `collection`: `null` \| `string`; `color`: `null` \| `string`; `filter`: `null` \|
`Record`\< `string`, `any` \>; `icon`: `null` \| `string`; `id`: `number`; `layout`: `null` \| `string`;
`layout_options`: `null` \| `Record`\< `string`, `any` \>; `layout_query`: `null` \| `Record`\< `string`, `any` \>;
`refresh_interval`: `null` \| `number`; `role`: `null` \| `string` \|
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_roles"`,
\{`admin_access`: `boolean`; `app_access`: `boolean`; `description`: `null` \| `string`; `enforce_tfa`: `boolean`;
`icon`: `string`; `id`: `string`; `ip_access`: `null` \| `string`; `name`: `string`;} \>; `search`: `null` \| `string`;
`user`: `null` \| `string` \| [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\<
`Schema`, `"directus_users"`, \{`auth_data`: `null` \| `Record`\< `string`, `any` \>; `avatar`: `null` \| `string` \|
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_files"`,
\{`charset`: `null` \| `string`; `description`: `null` \| `string`; `duration`: `null` \| `number`; `embed`: `unknown`;
`filename_disk`: `null` \| `string`; `filename_download`: `string`; `filesize`: `null` \| `string`; `folder`: `null` \|
`string` \| [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
`"directus_folders"`, \{`id`: `string`; `name`: `string`; `parent`: `null` \| `string` \|
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_folders"`,
`{ id: string; name: string; parent: string | MergeCoreCollection<Schema, "directus_folders", ...> | null; }` \>;} \>;
`height`: `null` \| `number`; `id`: `string`; `location`: `null` \| `string`; `metadata`: `null` \| `Record`\< `string`,
`any` \>; `modified_by`: `null` \| `string` \|
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_users"`,
`{ id: string; first_name: string | null; last_name: string | null; email: string | null; password: string | null; location: string | null; title: string | null; description: string | null; ... 13 more ...; email_notifications: boolean | null; }`
\>; `modified_on`: `string`; `storage`: `string`; `tags`: `null` \| `string`[]; `title`: `null` \| `string`; `type`:
`null` \| `string`; `uploaded_by`: `null` \| `string` \|
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_users"`,
`{ id: string; first_name: string | null; last_name: string | null; email: string | null; password: string | null; location: string | null; title: string | null; description: string | null; ... 13 more ...; email_notifications: boolean | null; }`
\>; `uploaded_on`: `string`; `width`: `null` \| `number`;} \>; `description`: `null` \| `string`; `email`: `null` \|
`string`; `email_notifications`: `null` \| `boolean`; `external_identifier`: `null` \| `string`; `first_name`: `null` \|
`string`; `id`: `string`; `language`: `null` \| `string`; `last_access`: `null` \| `string`; `last_name`: `null` \|
`string`; `last_page`: `null` \| `string`; `location`: `null` \| `string`; `password`: `null` \| `string`; `provider`:
`string`; `role`: `null` \| `string`; `status`: `string`; `tags`: `null` \| `string`[]; `tfa_secret`: `null` \|
`string`; `theme`: `null` \| `string`; `title`: `null` \| `string`; `token`: `null` \| `string`;} \>;} \> \>,
[`FieldsWildcard`](../../types-1/type-aliases/type-alias.FieldsWildcard.md)\<
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_presets"`,
\{`bookmark`: `null` \| `string`; `collection`: `null` \| `string`; `color`: `null` \| `string`; `filter`: `null` \|
`Record`\< `string`, `any` \>; `icon`: `null` \| `string`; `id`: `number`; `layout`: `null` \| `string`;
`layout_options`: `null` \| `Record`\< `string`, `any` \>; `layout_query`: `null` \| `Record`\< `string`, `any` \>;
`refresh_interval`: `null` \| `number`; `role`: `null` \| `string` \|
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_roles"`,
\{`admin_access`: `boolean`; `app_access`: `boolean`; `description`: `null` \| `string`; `enforce_tfa`: `boolean`;
`icon`: `string`; `id`: `string`; `ip_access`: `null` \| `string`; `name`: `string`;} \>; `search`: `null` \| `string`;
`user`: `null` \| `string` \| [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\<
`Schema`, `"directus_users"`, \{`auth_data`: `null` \| `Record`\< `string`, `any` \>; `avatar`: `null` \| `string` \|
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_files"`,
\{`charset`: `null` \| `string`; `description`: `null` \| `string`; `duration`: `null` \| `number`; `embed`: `unknown`;
`filename_disk`: `null` \| `string`; `filename_download`: `string`; `filesize`: `null` \| `string`; `folder`: `null` \|
`string` \| [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
`"directus_folders"`, \{`id`: `string`; `name`: `string`; `parent`: `null` \| `string` \|
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_folders"`,
`{ id: string; name: string; parent: string | MergeCoreCollection<Schema, "directus_folders", ...> | null; }` \>;} \>;
`height`: `null` \| `number`; `id`: `string`; `location`: `null` \| `string`; `metadata`: `null` \| `Record`\< `string`,
`any` \>; `modified_by`: `null` \| `string` \|
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_users"`,
`{ id: string; first_name: string | null; last_name: string | null; email: string | null; password: string | null; location: string | null; title: string | null; description: string | null; ... 13 more ...; email_notifications: boolean | null; }`
\>; `modified_on`: `string`; `storage`: `string`; `tags`: `null` \| `string`[]; `title`: `null` \| `string`; `type`:
`null` \| `string`; `uploaded_by`: `null` \| `string` \|
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_users"`,
`{ id: string; first_name: string | null; last_name: string | null; email: string | null; password: string | null; location: string | null; title: string | null; description: string | null; ... 13 more ...; email_notifications: boolean | null; }`
\>; `uploaded_on`: `string`; `width`: `null` \| `number`;} \>; `description`: `null` \| `string`; `email`: `null` \|
`string`; `email_notifications`: `null` \| `boolean`; `external_identifier`: `null` \| `string`; `first_name`: `null` \|
`string`; `id`: `string`; `language`: `null` \| `string`; `last_access`: `null` \| `string`; `last_name`: `null` \|
`string`; `last_page`: `null` \| `string`; `location`: `null` \| `string`; `password`: `null` \| `string`; `provider`:
`string`; `role`: `null` \| `string`; `status`: `string`; `tags`: `null` \| `string`[]; `tfa_secret`: `null` \|
`string`; `theme`: `null` \| `string`; `title`: `null` \| `string`; `token`: `null` \| `string`;} \>;} \> \>,
`Exclude`\< [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `TQuery`[`"fields"`] \> \>,
[`PickRelationalFields`](../../types-1/type-aliases/type-alias.PickRelationalFields.md)\<
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `TQuery`[`"fields"`] \> \> \> _extends_ `never` ?
`never` : _keyof_ [`PickRelationalFields`](../../types-1/type-aliases/type-alias.PickRelationalFields.md)\<
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `TQuery`[`"fields"`] \> \> \> \> \> \>,
[`PickRelationalFields`](../../types-1/type-aliases/type-alias.PickRelationalFields.md)\<
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`Mutable`](../../types-1/type-aliases/type-alias.Mutable.md)\< `TQuery`[`"fields"`] \> \> \> _extends_ `never` ?
`never` : \{ [Field in string \| number \| symbol]: Field extends keyof UnpackList\<MergeCoreCollection\<Schema,
"directus_presets", Object\>\> ? Extract\<UnpackList\<MergeCoreCollection\<Schema, "directus_presets",
Object\>\>[Field], ItemType\<Schema\>\> extends RelatedCollection ? IsNullable\<UnpackList\<MergeCoreCollection\<Schema,
"directus_presets", Object\>\>[Field], null \| (RelatedCollection extends any[] ?
HasManyToAnyRelation\<RelatedCollection\> extends never ? null \| ApplyNestedQueryFields\<Schema, RelatedCollection,
PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>[] : ApplyManyToAnyFields\<Schema,
RelatedCollection, PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field],
UnpackList\<RelatedCollection\>\>[] : ApplyNestedQueryFields\<Schema, RelatedCollection,
PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>), RelatedCollection extends any[] ?
HasManyToAnyRelation\<RelatedCollection\> extends never ? null \| ApplyNestedQueryFields\<Schema, RelatedCollection,
PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>[] : ApplyManyToAnyFields\<Schema,
RelatedCollection, PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field],
UnpackList\<RelatedCollection\>\>[] : ApplyNestedQueryFields\<Schema, RelatedCollection,
PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>\> : never : never } \> \>, `Schema` \>

Returns a Preset object if a valid primary key was provided.

## Source

[rest/commands/read/presets.ts:33](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/presets.ts#L33)
