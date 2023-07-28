---
editLink: false
---

# Type alias: ApplyQueryFields`<Schema, Collection, ReadonlyFields, CollectionItem, Fields, RelationalFields, RelationalKeys, FlatFields>`

> **ApplyQueryFields**: \<`Schema`, `Collection`, `ReadonlyFields`, `CollectionItem`, `Fields`, `RelationalFields`,
> `RelationalKeys`, `FlatFields`\> [`IfAny`](type-alias.IfAny.md)\< `Schema`, `Record`\< `string`, `any` \>,
> [`Merge`](type-alias.Merge.md)\< [`PickFlatFields`](type-alias.PickFlatFields.md)\< `Schema`, `CollectionItem`,
> `FlatFields` \>, `RelationalFields` _extends_ `never` ? `never` : \{ [Field in keyof RelationalFields]: Field extends
> keyof CollectionItem ? Extract\<CollectionItem[Field], ItemType\<Schema\>\> extends infer RelatedCollection ?
> RelationNullable\<CollectionItem[Field], RelatedCollection extends any[] ? HasManyToAnyRelation\<RelatedCollection\>
> extends never ? ApplyNestedQueryFields\<Schema, RelatedCollection, RelationalFields[Field]\>[] \| null :
> ApplyManyToAnyFields\<Schema, RelatedCollection, RelationalFields[Field]\>[] : ApplyNestedQueryFields\<Schema,
> RelatedCollection, RelationalFields[Field]\>\> : never : never } \> \>

Apply the configured fields query parameter on a given Item type

## Type parameters

| Parameter                           | Default                                                                                                           |
| :---------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`         | -                                                                                                                 |
| `Collection` _extends_ `object`     | -                                                                                                                 |
| `ReadonlyFields`                    | -                                                                                                                 |
| `CollectionItem` _extends_ `object` | [`UnpackList`](type-alias.UnpackList.md)\< `Collection` \>                                                        |
| `Fields`                            | [`UnpackList`](type-alias.UnpackList.md)\< [`Mutable`](type-alias.Mutable.md)\< `ReadonlyFields` \> \>            |
| `RelationalFields`                  | [`PickRelationalFields`](type-alias.PickRelationalFields.md)\< `Fields` \>                                        |
| `RelationalKeys`                    | `RelationalFields` _extends_ `never` ? `never` : _keyof_ `RelationalFields`                                       |
| `FlatFields`                        | [`FieldsWildcard`](type-alias.FieldsWildcard.md)\< `CollectionItem`, `Exclude`\< `Fields`, `RelationalKeys` \> \> |

## Source

[types/output.ts:8](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/output.ts#L8)
