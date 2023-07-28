---
editLink: false
---

# Function: readItem()

> **readItem**\<`Schema`, `Collection`, `TQuery`\>( `collection`, `key`, `query`?):
> [`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
> `Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\<
> [`PickFlatFields`](../../types-1/type-aliases/type-alias.PickFlatFields.md)\< `Schema`,
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `any`, `Collection` _extends_ _keyof_ `Schema` ?
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> _extends_ `object` ?
> `object` & [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> : `never` :
> `never` \> \>, [`FieldsWildcard`](../../types-1/type-aliases/type-alias.FieldsWildcard.md)\<
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `any`, `Collection` _extends_ _keyof_ `Schema` ?
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> _extends_ `object` ?
> `object` & [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> : `never` :
> `never` \> \>, `Exclude`\< [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
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
> `never` : \{ [Field in string \| number \| symbol]: Field extends keyof UnpackList\<IfAny\<Schema, any, Collection
> extends keyof Schema ? UnpackList\<Schema[Collection]\> extends object ? object & UnpackList\<Schema[Collection]\> :
> never : never\>\> ? Extract\<UnpackList\<IfAny\<Schema, any, Collection extends keyof Schema ?
> UnpackList\<Schema[Collection]\> extends object ? object & UnpackList\<Schema[Collection]\> : never :
> never\>\>[Field], ItemType\<Schema\>\> extends RelatedCollection ? IsNullable\<UnpackList\<IfAny\<Schema, any,
> Collection extends keyof Schema ? UnpackList\<Schema[Collection]\> extends object ? object &
> UnpackList\<Schema[Collection]\> : never : never\>\>[Field], null \| (RelatedCollection extends any[] ?
> HasManyToAnyRelation\<RelatedCollection\> extends never ? null \| ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>[] : ApplyManyToAnyFields\<Schema,
> RelatedCollection, PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field],
> UnpackList\<RelatedCollection\>\>[] : ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>), RelatedCollection extends any[] ?
> HasManyToAnyRelation\<RelatedCollection\> extends never ? null \| ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>[] : ApplyManyToAnyFields\<Schema,
> RelatedCollection, PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field],
> UnpackList\<RelatedCollection\>\>[] : ApplyNestedQueryFields\<Schema, RelatedCollection,
> PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>\> : never : never } \> \>, `Schema` \>

Get an item that exists in Directus.

## Type parameters

| Parameter                                                                                                                                                                                        |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                                                                                                                      |
| `Collection` _extends_ `string` \| `number` \| `symbol`                                                                                                                                          |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, [`CollectionType`](../../types-1/type-aliases/type-alias.CollectionType.md)\< `Schema`, `Collection` \> \> |

## Parameters

| Parameter    | Type         | Description                 |
| :----------- | :----------- | :-------------------------- |
| `collection` | `Collection` | The collection of the item  |
| `key`        | `PrimaryKey` | The primary key of the item |
| `query`?     | `TQuery`     | The query parameters        |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
`Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\<
[`PickFlatFields`](../../types-1/type-aliases/type-alias.PickFlatFields.md)\< `Schema`,
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `any`, `Collection` _extends_ _keyof_ `Schema` ?
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> _extends_ `object` ?
`object` & [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> : `never` :
`never` \> \>, [`FieldsWildcard`](../../types-1/type-aliases/type-alias.FieldsWildcard.md)\<
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
[`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `any`, `Collection` _extends_ _keyof_ `Schema` ?
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> _extends_ `object` ?
`object` & [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `Schema`[`Collection`] \> : `never` :
`never` \> \>, `Exclude`\< [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\<
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
`never` : \{ [Field in string \| number \| symbol]: Field extends keyof UnpackList\<IfAny\<Schema, any, Collection
extends keyof Schema ? UnpackList\<Schema[Collection]\> extends object ? object & UnpackList\<Schema[Collection]\> :
never : never\>\> ? Extract\<UnpackList\<IfAny\<Schema, any, Collection extends keyof Schema ?
UnpackList\<Schema[Collection]\> extends object ? object & UnpackList\<Schema[Collection]\> : never : never\>\>[Field],
ItemType\<Schema\>\> extends RelatedCollection ? IsNullable\<UnpackList\<IfAny\<Schema, any, Collection extends keyof
Schema ? UnpackList\<Schema[Collection]\> extends object ? object & UnpackList\<Schema[Collection]\> : never :
never\>\>[Field], null \| (RelatedCollection extends any[] ? HasManyToAnyRelation\<RelatedCollection\> extends never ?
null \| ApplyNestedQueryFields\<Schema, RelatedCollection,
PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>[] : ApplyManyToAnyFields\<Schema,
RelatedCollection, PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field],
UnpackList\<RelatedCollection\>\>[] : ApplyNestedQueryFields\<Schema, RelatedCollection,
PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>), RelatedCollection extends any[] ?
HasManyToAnyRelation\<RelatedCollection\> extends never ? null \| ApplyNestedQueryFields\<Schema, RelatedCollection,
PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>[] : ApplyManyToAnyFields\<Schema,
RelatedCollection, PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field],
UnpackList\<RelatedCollection\>\>[] : ApplyNestedQueryFields\<Schema, RelatedCollection,
PickRelationalFields\<UnpackList\<Mutable\<TQuery["fields"]\>\>\>[Field]\>\> : never : never } \> \>, `Schema` \>

Returns an item object if a valid primary key was provided.

## Source

[rest/commands/read/items.ts:52](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/items.ts#L52)
