---
editLink: false
---

# Function: readCollection()

> **readCollection**\<`Schema`\>(`collection`): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`, `any` \>,
> [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
> [`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
> [`DirectusCollection`](../../schema/type-aliases/type-alias.DirectusCollection.md)\< `Schema` \> \>, _keyof_
> [`DirectusCollection`](../../schema/type-aliases/type-alias.DirectusCollection.md)\< `Schema` \> \>, `never` \> \>,
> `Schema` \>

Retrieve a single collection by table name.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter    | Type     | Description         |
| :----------- | :------- | :------------------ |
| `collection` | `string` | The collection name |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
`Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
[`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
[`DirectusCollection`](../../schema/type-aliases/type-alias.DirectusCollection.md)\< `Schema` \> \>, _keyof_
[`DirectusCollection`](../../schema/type-aliases/type-alias.DirectusCollection.md)\< `Schema` \> \>, `never` \> \>,
`Schema` \>

A collection object.

## Source

[rest/commands/read/collections.ts:27](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/collections.ts#L27)
