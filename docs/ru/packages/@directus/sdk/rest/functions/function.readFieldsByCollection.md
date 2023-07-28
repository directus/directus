---
editLink: false
---

# Function: readFieldsByCollection()

> **readFieldsByCollection**\<`Schema`\>(`collection`): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`, `any` \>,
> [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
> [`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
> [`DirectusField`](../../schema/type-aliases/type-alias.DirectusField.md)\< `Schema` \> \>, _keyof_
> [`DirectusField`](../../schema/type-aliases/type-alias.DirectusField.md)\< `Schema` \> \>, `never` \> \>[], `Schema`
> \>

List the available fields in a given collection.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter    | Type     | Description                  |
| :----------- | :------- | :--------------------------- |
| `collection` | `string` | The primary key of the field |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
`Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
[`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
[`DirectusField`](../../schema/type-aliases/type-alias.DirectusField.md)\< `Schema` \> \>, _keyof_
[`DirectusField`](../../schema/type-aliases/type-alias.DirectusField.md)\< `Schema` \> \>, `never` \> \>[], `Schema` \>

## Source

[rest/commands/read/fields.ts:29](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/fields.ts#L29)
