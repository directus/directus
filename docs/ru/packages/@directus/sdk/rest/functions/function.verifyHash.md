---
editLink: false
---

# Function: verifyHash()

> **verifyHash**\<`Schema`\>(`string`, `hash`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `boolean`,
> `Schema` \>

Verify a string with a hash.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type     | Description                      |
| :-------- | :------- | :------------------------------- |
| `string`  | `string` | Source string.                   |
| `hash`    | `string` | Hash you want to verify against. |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `boolean`, `Schema` \>

Boolean.

## Source

[rest/commands/utils/hash.ts:23](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/utils/hash.ts#L23)
