---
editLink: false
---

# Function: readRelation()

> **readRelation**\<`Schema`, `TQuery`\>(`collection`, `field`):
> [`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
> `Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\<
> [`PickFlatFields`](../../types-1/type-aliases/type-alias.PickFlatFields.md)\< `Schema`,
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `TQuery` \>, _keyof_
> [`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `TQuery` \> \>, `never` \> \>, `Schema` \>

List an existing Relation by primary key.

## Type parameters

| Parameter                                                                                                                                                                             |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Schema` _extends_ `object`                                                                                                                                                           |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, [`DirectusRelation`](../../schema/type-aliases/type-alias.DirectusRelation.md)\< `Schema` \> \> |

## Parameters

| Parameter    | Type     | Description    |
| :----------- | :------- | :------------- |
| `collection` | `string` | The collection |
| `field`      | `string` | The field      |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
`Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\<
[`PickFlatFields`](../../types-1/type-aliases/type-alias.PickFlatFields.md)\< `Schema`,
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `TQuery` \>, _keyof_
[`UnpackList`](../../types-1/type-aliases/type-alias.UnpackList.md)\< `TQuery` \> \>, `never` \> \>, `Schema` \>

Returns a Relation object if a valid primary key was provided.

## Source

[rest/commands/read/relations.ts:43](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/relations.ts#L43)
