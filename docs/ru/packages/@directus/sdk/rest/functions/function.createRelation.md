---
editLink: false
---

# Function: createRelation()

> **createRelation**\<`Schema`\>(`item`): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`, `any` \>,
> [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
> [`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
> [`DirectusRelation`](../../schema/type-aliases/type-alias.DirectusRelation.md)\< `Schema` \> \>, _keyof_
> [`DirectusRelation`](../../schema/type-aliases/type-alias.DirectusRelation.md)\< `Schema` \> \>, `never` \> \>,
> `Schema` \>

Create a new relation.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                                                                                                        | Description            |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------- |
| `item`    | [`NestedPartial`](../../types-1/type-aliases/type-alias.NestedPartial.md)\< [`DirectusRelation`](../../schema/type-aliases/type-alias.DirectusRelation.md)\< `Schema` \> \> | The relation to create |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
`Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
[`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
[`DirectusRelation`](../../schema/type-aliases/type-alias.DirectusRelation.md)\< `Schema` \> \>, _keyof_
[`DirectusRelation`](../../schema/type-aliases/type-alias.DirectusRelation.md)\< `Schema` \> \>, `never` \> \>, `Schema`
\>

Returns the relation object for the created relation.

## Source

[rest/commands/create/relations.ts:19](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/create/relations.ts#L19)
