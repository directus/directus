---
editLink: false
---

# Function: readRelations()

> **readRelations**\<`Schema`\>(): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`, `any` \>,
> [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
> [`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
> [`DirectusRelation`](../../schema/type-aliases/type-alias.DirectusRelation.md)\< `Schema` \> \>, _keyof_
> [`DirectusRelation`](../../schema/type-aliases/type-alias.DirectusRelation.md)\< `Schema` \> \>, `never` \> \>[],
> `Schema` \>

List all Relations that exist in Directus.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
`Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
[`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
[`DirectusRelation`](../../schema/type-aliases/type-alias.DirectusRelation.md)\< `Schema` \> \>, _keyof_
[`DirectusRelation`](../../schema/type-aliases/type-alias.DirectusRelation.md)\< `Schema` \> \>, `never` \> \>[],
`Schema` \>

An array of up to limit Relation objects. If no items are available, data will be an empty array.

## Source

[rest/commands/read/relations.ts:16](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/relations.ts#L16)
