---
editLink: false
---

# Function: readSettings()

> **readSettings**\<`Schema`, `TQuery`\>(`query`?): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`, `any` \>,
> [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\<
> [`PickFlatFields`](../../types-1/type-aliases/type-alias.PickFlatFields.md)\< `Schema`,
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_settings"`, \{`auth_login_attempts`: `number`; `auth_password_policy`: `null` \| `string`; `basemaps`:
> `null` \| `Record`\< `string`, `any` \>; `custom_aspect_ratios`: `null` \| `Record`\< `string`, `any` \>;
> `custom_css`: `null` \| `string`; `default_language`: `string`; `id`: `1`; `mapbox_key`: `null` \| `string`;
> `module_bar`: `any`; `project_color`: `null` \| `string`; `project_descriptor`: `null` \| `string`; `project_logo`:
> `null` \| `string`; `project_name`: `string`; `project_url`: `string`; `public_background`: `null` \| `string`;
> `public_foreground`: `null` \| `string`; `public_note`: `null` \| `string`; `storage_asset_presets`: `null` \|
> \{`fit`: `string`; `height`: `number`; `key`: `string`; `quality`: `number`; `width`: `number`; `withoutEnlargement`:
> `boolean`;}[]; `storage_asset_transform`: `"all"` \| `"none"` \| `"presets"`; `storage_default_folder`: `null` \|
> `string` \| [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_folders"`, \{`id`: `string`; `name`: `string`; `parent`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_folders"`,
> `{ id: string; name: string; parent: string | MergeCoreCollection<Schema, "directus_folders", ...> | null; }` \>;}
> \>;} \> \>, [`FieldsWildcard`](../../types-1/type-aliases/type-alias.FieldsWildcard.md)\<
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_settings"`, \{`auth_login_attempts`: `number`; `auth_password_policy`: `null` \| `string`; `basemaps`:
> `null` \| `Record`\< `string`, `any` \>; `custom_aspect_ratios`: `null` \| `Record`\< `string`, `any` \>;
> `custom_css`: `null` \| `string`; `default_language`: `string`; `id`: `1`; `mapbox_key`: `null` \| `string`;
> `module_bar`: `any`; `project_color`: `null` \| `string`; `project_descriptor`: `null` \| `string`; `project_logo`:
> `null` \| `string`; `project_name`: `string`; `project_url`: `string`; `public_background`: `null` \| `string`;
> `public_foreground`: `null` \| `string`; `public_note`: `null` \| `string`; `storage_asset_presets`: `null` \|
> \{`fit`: `string`; `height`: `number`; `key`: `string`; `quality`: `number`; `width`: `number`; `withoutEnlargement`:
> `boolean`;}[]; `storage_asset_transform`: `"all"` \| `"none"` \| `"presets"`; `storage_default_folder`: `null` \|
> `string` \| [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_folders"`, \{`id`: `string`; `name`: `string`; `parent`: `null` \| `string` \|
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_folders"`,
> `{ id: string; name: string; parent: string | MergeCoreCollection<Schema, "directus_folders", ...> | null; }` \>;}
> \>;} \> \>, `Exclude`\< [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
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
> "directus_settings", Object\>\> ? Extract\<UnpackList\<MergeCoreCollection\<Schema, "directus_settings",
> Object\>\>[Field], ItemType\<Schema\>\> extends RelatedCollection ?
> IsNullable\<UnpackList\<MergeCoreCollection\<Schema, "directus_settings", Object\>\>[Field], null \|
> (RelatedCollection extends any[] ? HasManyToAnyRelation\<RelatedCollection\> extends never ? null \|
> ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>[] : ApplyManyToAnyFields\<Schema,
> RelatedCollection, PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field],
> UnpackList\<RelatedCollection\>\>[] : ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>), RelatedCollection extends any[] ?
> HasManyToAnyRelation\<RelatedCollection\> extends never ? null \| ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>[] : ApplyManyToAnyFields\<Schema,
> RelatedCollection, PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field],
> UnpackList\<RelatedCollection\>\>[] : ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>\> : never : never } \> \>, `Schema` \>

Retrieve Settings.

## Type parameters

| Parameter                                                                                                                                                                             |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Schema` _extends_ `object`                                                                                                                                                           |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, [`DirectusSettings`](../../schema/type-aliases/type-alias.DirectusSettings.md)\< `Schema` \> \> |

## Parameters

| Parameter | Type     | Description          |
| :-------- | :------- | :------------------- |
| `query`?  | `TQuery` | The query parameters |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
`Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\<
[`PickFlatFields`](../../types-1/type-aliases/type-alias.PickFlatFields.md)\< `Schema`,
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_settings"`,
\{`auth_login_attempts`: `number`; `auth_password_policy`: `null` \| `string`; `basemaps`: `null` \| `Record`\<
`string`, `any` \>; `custom_aspect_ratios`: `null` \| `Record`\< `string`, `any` \>; `custom_css`: `null` \| `string`;
`default_language`: `string`; `id`: `1`; `mapbox_key`: `null` \| `string`; `module_bar`: `any`; `project_color`: `null`
\| `string`; `project_descriptor`: `null` \| `string`; `project_logo`: `null` \| `string`; `project_name`: `string`;
`project_url`: `string`; `public_background`: `null` \| `string`; `public_foreground`: `null` \| `string`;
`public_note`: `null` \| `string`; `storage_asset_presets`: `null` \| \{`fit`: `string`; `height`: `number`; `key`:
`string`; `quality`: `number`; `width`: `number`; `withoutEnlargement`: `boolean`;}[]; `storage_asset_transform`:
`"all"` \| `"none"` \| `"presets"`; `storage_default_folder`: `null` \| `string` \|
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_folders"`,
\{`id`: `string`; `name`: `string`; `parent`: `null` \| `string` \|
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_folders"`,
`{ id: string; name: string; parent: string | MergeCoreCollection<Schema, "directus_folders", ...> | null; }` \>;} \>;}
\> \>, [`FieldsWildcard`](../../types-1/type-aliases/type-alias.FieldsWildcard.md)\<
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_settings"`,
\{`auth_login_attempts`: `number`; `auth_password_policy`: `null` \| `string`; `basemaps`: `null` \| `Record`\<
`string`, `any` \>; `custom_aspect_ratios`: `null` \| `Record`\< `string`, `any` \>; `custom_css`: `null` \| `string`;
`default_language`: `string`; `id`: `1`; `mapbox_key`: `null` \| `string`; `module_bar`: `any`; `project_color`: `null`
\| `string`; `project_descriptor`: `null` \| `string`; `project_logo`: `null` \| `string`; `project_name`: `string`;
`project_url`: `string`; `public_background`: `null` \| `string`; `public_foreground`: `null` \| `string`;
`public_note`: `null` \| `string`; `storage_asset_presets`: `null` \| \{`fit`: `string`; `height`: `number`; `key`:
`string`; `quality`: `number`; `width`: `number`; `withoutEnlargement`: `boolean`;}[]; `storage_asset_transform`:
`"all"` \| `"none"` \| `"presets"`; `storage_default_folder`: `null` \| `string` \|
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_folders"`,
\{`id`: `string`; `name`: `string`; `parent`: `null` \| `string` \|
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`, `"directus_folders"`,
`{ id: string; name: string; parent: string | MergeCoreCollection<Schema, "directus_folders", ...> | null; }` \>;} \>;}
\> \>, `Exclude`\< [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
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
"directus_settings", Object\>\> ? Extract\<UnpackList\<MergeCoreCollection\<Schema, "directus_settings",
Object\>\>[Field], ItemType\<Schema\>\> extends RelatedCollection ? IsNullable\<UnpackList\<MergeCoreCollection\<Schema,
"directus_settings", Object\>\>[Field], null \| (RelatedCollection extends any[] ?
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

Returns the settings object.

## Source

[rest/commands/read/settings.ts:19](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/settings.ts#L19)
