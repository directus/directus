---
editLink: false
---

# Function: schemaApply()

> **schemaApply**\<`Schema`\>(`diff`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Update the instance's schema by passing the diff previously retrieved via /schema/diff endpoint in the request body.
This endpoint is only available to admin users.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                 | Description                                                                           |
| :-------- | :------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `diff`    | [`SchemaDiffOutput`](../type-aliases/type-alias.SchemaDiffOutput.md) | JSON object containing hash and diffs of collections, fields, and relations to apply. |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Empty body.

## Source

[rest/commands/schema/apply.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/schema/apply.ts#L10)
