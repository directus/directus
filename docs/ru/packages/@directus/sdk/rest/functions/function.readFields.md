---
editLink: false
---

# Function: readFields()

> **readFields**\<`Schema`\>(): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\< `Schema`, `Record`\< `string`, `any` \>,
> [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
> [`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
> [`DirectusField`](../../schema/type-aliases/type-alias.DirectusField.md)\< `Schema` \> \>, _keyof_
> [`DirectusField`](../../schema/type-aliases/type-alias.DirectusField.md)\< `Schema` \> \>, `never` \> \>[], `Schema`
> \>

List the available fields.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< [`IfAny`](../../types-1/type-aliases/type-alias.IfAny.md)\<
`Schema`, `Record`\< `string`, `any` \>, [`Merge`](../../types-1/type-aliases/type-alias.Merge.md)\< `Pick`\<
[`RemoveRelationships`](../../types-1/type-aliases/type-alias.RemoveRelationships.md)\< `Schema`,
[`DirectusField`](../../schema/type-aliases/type-alias.DirectusField.md)\< `Schema` \> \>, _keyof_
[`DirectusField`](../../schema/type-aliases/type-alias.DirectusField.md)\< `Schema` \> \>, `never` \> \>[], `Schema` \>

An array of field objects.

## Source

[rest/commands/read/fields.ts:17](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/read/fields.ts#L17)
