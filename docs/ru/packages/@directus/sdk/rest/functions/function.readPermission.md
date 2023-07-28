---
editLink: false
---

# Function: readPermission()

> **readPermission**\<`Schema`, `TQuery`\>(`key`, `query`?): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`, `any` \>,
> [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\<
> [`PickFlatFields`](../../types-1/type-aliases/type-alias.PickFlatFields.md)\< `Schema`,
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_permissions"`, \{`action`: `string`; `collection`: `string`; `fields`: `null` \| `string`; `id`: `number`;
> `permissions`: `null` \| `Record`\< `string`, `any` \>; `presets`: `null` \| `Record`\< `string`, `any` \>; `role`:
> `null` \| `string` \| [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\<
> `Schema`, `"directus_roles"`, \{`admin_access`: `boolean`; `app_access`: `boolean`; `description`: `null` \| `string`;
> `enforce_tfa`: `boolean`; `icon`: `string`; `id`: `string`; `ip_access`: `null` \| `string`; `name`: `string`;} \>;
> `validation`: `null` \| `Record`\< `string`, `any` \>;} \> \>,
> [`FieldsWildcard`](../../types-1/type-aliases/type-alias.FieldsWildcard.md)\<
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
> `"directus_permissions"`, \{`action`: `string`; `collection`: `string`; `fields`: `null` \| `string`; `id`: `number`;
> `permissions`: `null` \| `Record`\< `string`, `any` \>; `presets`: `null` \| `Record`\< `string`, `any` \>; `role`:
> `null` \| `string` \| [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\<
> `Schema`, `"directus_roles"`, \{`admin_access`: `boolean`; `app_access`: `boolean`; `description`: `null` \| `string`;
> `enforce_tfa`: `boolean`; `icon`: `string`; `id`: `string`; `ip_access`: `null` \| `string`; `name`: `string`;} \>;
> `validation`: `null` \| `Record`\< `string`, `any` \>;} \> \>, `Exclude`\<
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
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
> "directus_permissions", Object\>\> ? Extract\<UnpackList\<MergeCoreCollection\<Schema, "directus_permissions",
> Object\>\>[Field], ItemType\<Schema\>\> extends RelatedCollection ?
> IsNullable\<UnpackList\<MergeCoreCollection\<Schema, "directus_permissions", Object\>\>[Field], null \|
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

List all Permissions that exist in Directus.

## Type parameters

| Parameter                                                                                                                                                                                 |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                                                                                                               |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, [`DirectusPermission`](../../schema/type-aliases/type-alias.DirectusPermission.md)\< `Schema` \> \> |

## Parameters

| Parameter | Type                                                                                                     | Description                      |
| :-------- | :------------------------------------------------------------------------------------------------------- | :------------------------------- |
| `key`     | [`DirectusPermission`](../../schema/type-aliases/type-alias.DirectusPermission.md)\< `Schema` \>[`"id"`] | The primary key of the dashboard |
| `query`?  | `TQuery`                                                                                                 | The query parameters             |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
`Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\<
[`PickFlatFields`](../../types-1/type-aliases/type-alias.PickFlatFields.md)\< `Schema`,
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
`"directus_permissions"`, \{`action`: `string`; `collection`: `string`; `fields`: `null` \| `string`; `id`: `number`;
`permissions`: `null` \| `Record`\< `string`, `any` \>; `presets`: `null` \| `Record`\< `string`, `any` \>; `role`:
`null` \| `string` \| [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
`"directus_roles"`, \{`admin_access`: `boolean`; `app_access`: `boolean`; `description`: `null` \| `string`;
`enforce_tfa`: `boolean`; `icon`: `string`; `id`: `string`; `ip_access`: `null` \| `string`; `name`: `string`;} \>;
`validation`: `null` \| `Record`\< `string`, `any` \>;} \> \>,
[`FieldsWildcard`](../../types-1/type-aliases/type-alias.FieldsWildcard.md)\<
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
`"directus_permissions"`, \{`action`: `string`; `collection`: `string`; `fields`: `null` \| `string`; `id`: `number`;
`permissions`: `null` \| `Record`\< `string`, `any` \>; `presets`: `null` \| `Record`\< `string`, `any` \>; `role`:
`null` \| `string` \| [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
`"directus_roles"`, \{`admin_access`: `boolean`; `app_access`: `boolean`; `description`: `null` \| `string`;
`enforce_tfa`: `boolean`; `icon`: `string`; `id`: `string`; `ip_access`: `null` \| `string`; `name`: `string`;} \>;
`validation`: `null` \| `Record`\< `string`, `any` \>;} \> \>, `Exclude`\<
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
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
"directus_permissions", Object\>\> ? Extract\<UnpackList\<MergeCoreCollection\<Schema, "directus_permissions",
Object\>\>[Field], ItemType\<Schema\>\> extends RelatedCollection ? IsNullable\<UnpackList\<MergeCoreCollection\<Schema,
"directus_permissions", Object\>\>[Field], null \| (RelatedCollection extends any[] ?
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

Returns a Permission object if a valid primary key was provided.

## Source

[rest/commands/read/permissions.ts:33](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/permissions.ts#L33)
