---
editLink: false
---

# Function: generateHash()

> **generateHash**\<`Schema`\>(`string`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `string`, `Schema`
> \>

Generate a hash for a given string.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type     | Description     |
| :-------- | :------- | :-------------- |
| `string`  | `string` | String to hash. |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `string`, `Schema` \>

Hashed string.

## Source

[rest/commands/utils/hash.ts:9](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/utils/hash.ts#L9)
