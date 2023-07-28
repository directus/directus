---
editLink: false
---

# Function: schemaSnapshot()

> **schemaSnapshot**\<`Schema`\>(): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`SchemaSnapshotOutput`](../type-aliases/type-alias.SchemaSnapshotOutput.md), `Schema` \>

Retrieve the current schema. This endpoint is only available to admin users.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\<
[`SchemaSnapshotOutput`](../type-aliases/type-alias.SchemaSnapshotOutput.md), `Schema` \>

Returns the JSON object containing schema details.

## Source

[rest/commands/schema/snapshot.ts:18](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/schema/snapshot.ts#L18)
