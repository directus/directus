---
editLink: false
---

# Function: readField()

> **readField**\<`Schema`\>(`collection`, `field`): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`, `any` \>,
> [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
> [`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
> [`DirectusField`](../../schema/type-aliases/type-alias.DirectusField.md)\< `Schema` \> \>, _keyof_
> [`DirectusField`](../../schema/type-aliases/type-alias.DirectusField.md)\< `Schema` \> \>, `never` \> \>, `Schema` \>

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter    | Type     |
| :----------- | :------- |
| `collection` | `string` |
| `field`      | `string` |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
`Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
[`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
[`DirectusField`](../../schema/type-aliases/type-alias.DirectusField.md)\< `Schema` \> \>, _keyof_
[`DirectusField`](../../schema/type-aliases/type-alias.DirectusField.md)\< `Schema` \> \>, `never` \> \>, `Schema` \>

## Source

[rest/commands/read/fields.ts:44](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/fields.ts#L44)
