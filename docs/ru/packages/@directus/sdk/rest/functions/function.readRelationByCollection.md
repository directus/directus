---
editLink: false
---

# Function: readRelationByCollection()

> **readRelationByCollection**\<`Schema`\>(`collection`): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`, `any` \>,
> [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
> [`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
> [`DirectusRelation`](../../schema/type-aliases/type-alias.DirectusRelation.md)\< `Schema` \> \>, _keyof_
> [`DirectusRelation`](../../schema/type-aliases/type-alias.DirectusRelation.md)\< `Schema` \> \>, `never` \> \>,
> `Schema` \>

List an existing Relation by primary key.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter    | Type     | Description    |
| :----------- | :------- | :------------- |
| `collection` | `string` | The collection |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
`Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
[`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
[`DirectusRelation`](../../schema/type-aliases/type-alias.DirectusRelation.md)\< `Schema` \> \>, _keyof_
[`DirectusRelation`](../../schema/type-aliases/type-alias.DirectusRelation.md)\< `Schema` \> \>, `never` \> \>, `Schema`
\>

Returns a Relation object if a valid primary key was provided.

## Source

[rest/commands/read/relations.ts:28](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/relations.ts#L28)
