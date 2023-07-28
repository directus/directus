---
editLink: false
---

# Function: utilsImport()

> **utilsImport**\<`Schema`\>(`collection`, `data`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`,
> `Schema` \>

Import multiple records from a JSON or CSV file into a collection.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter    | Type             |
| :----------- | :--------------- |
| `collection` | _keyof_ `Schema` |
| `data`       | `FormData`       |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Nothing

## Source

[rest/commands/utils/import.ts:8](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/utils/import.ts#L8)
