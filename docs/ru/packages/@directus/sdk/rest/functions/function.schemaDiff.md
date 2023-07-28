---
editLink: false
---

# Function: schemaDiff()

> **schemaDiff**\<`Schema`\>(`snapshot`, `force` = `false`): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> [`SchemaDiffOutput`](../type-aliases/type-alias.SchemaDiffOutput.md), `Schema` \>

Compare the current instance's schema against the schema snapshot in JSON request body and retrieve the difference. This
endpoint is only available to admin users.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter  | Type                                                                         | Default value | Description                                                         |
| :--------- | :--------------------------------------------------------------------------- | :------------ | :------------------------------------------------------------------ |
| `snapshot` | [`SchemaSnapshotOutput`](../type-aliases/type-alias.SchemaSnapshotOutput.md) | `undefined`   | JSON object containing collections, fields, and relations to apply. |
| `force`    | `boolean`                                                                    | `false`       | Bypass version and database vendor restrictions.                    |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\<
[`SchemaDiffOutput`](../type-aliases/type-alias.SchemaDiffOutput.md), `Schema` \>

Returns the differences between the current instance's schema and the schema passed in the request body.

## Source

[rest/commands/schema/diff.ts:17](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/schema/diff.ts#L17)
