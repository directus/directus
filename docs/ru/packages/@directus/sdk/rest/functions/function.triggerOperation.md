---
editLink: false
---

# Function: triggerOperation()

> **triggerOperation**\<`Schema`\>(`id`, `data`?): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `unknown`,
> `Schema` \>

Trigger an operation

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type     |
| :-------- | :------- |
| `id`      | `string` |
| `data`?   | `any`    |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `unknown`, `Schema` \>

Result of the flow, if any.

## Source

[rest/commands/utils/operations.ts:12](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/utils/operations.ts#L12)
