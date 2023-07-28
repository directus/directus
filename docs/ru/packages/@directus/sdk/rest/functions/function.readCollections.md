---
editLink: false
---

# Function: readCollections()

> **readCollections**\<`Schema`\>(): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`, `any` \>,
> [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
> [`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
> [`DirectusCollection`](../../schema/type-aliases/type-alias.DirectusCollection.md)\< `Schema` \> \>, _keyof_
> [`DirectusCollection`](../../schema/type-aliases/type-alias.DirectusCollection.md)\< `Schema` \> \>, `never` \> \>[],
> `Schema` \>

List the available collections.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
`Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
[`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
[`DirectusCollection`](../../schema/type-aliases/type-alias.DirectusCollection.md)\< `Schema` \> \>, _keyof_
[`DirectusCollection`](../../schema/type-aliases/type-alias.DirectusCollection.md)\< `Schema` \> \>, `never` \> \>[],
`Schema` \>

An array of collection objects.

## Source

[rest/commands/read/collections.ts:15](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/collections.ts#L15)
