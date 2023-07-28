---
editLink: false
---

# Function: readShareInfo()

> **readShareInfo**\<`Schema`\>(`id`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< \{`collection`:
> `string`; `date_end`: `null` \| `string`; `date_start`: `null` \| `string`; `id`: `string`; `item`: `string`;
> `max_uses`: `null` \| `number`; `password`: `null` \| `string`; `times_used`: `null` \| `number`;}, `Schema` \>

Allows unauthenticated users to retrieve information about the share.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type     | Description                              |
| :-------- | :------- | :--------------------------------------- |
| `id`      | `string` | Primary key of the share you're viewing. |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< \{`collection`: `string`; `date_end`: `null` \| `string`;
`date_start`: `null` \| `string`; `id`: `string`; `item`: `string`; `max_uses`: `null` \| `number`; `password`: `null`
\| `string`; `times_used`: `null` \| `number`;}, `Schema` \>

The share objects for the given UUID, if it's still valid.

## Source

[rest/commands/utils/shares.ts:54](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/utils/shares.ts#L54)
