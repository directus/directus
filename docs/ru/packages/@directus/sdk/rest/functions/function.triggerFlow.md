---
editLink: false
---

# Function: triggerFlow()

> **triggerFlow**\<`Schema`\>( `method`, `id`, `data`?): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> `unknown`, `Schema` \>

Trigger a flow

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                             |
| :-------- | :------------------------------- |
| `method`  | `"POST"` \| `"GET"`              |
| `id`      | `string`                         |
| `data`?   | `Record`\< `string`, `string` \> |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `unknown`, `Schema` \>

Result of the flow, if any.

## Source

[rest/commands/utils/flows.ts:13](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/utils/flows.ts#L13)
