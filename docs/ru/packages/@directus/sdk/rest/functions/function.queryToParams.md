---
editLink: false
---

# Function: queryToParams()

> **queryToParams**\<`Schema`, `Item`\>(`query`): `Record`\< `string`, `string` \>

Transform nested query object to an url compatible format

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |
| `Item`                      |

## Parameters

| Parameter | Type                                  | Description             |
| :-------- | :------------------------------------ | :---------------------- |
| `query`   | `ExtendedQuery`\< `Schema`, `Item` \> | The nested query object |

## Returns

`Record`\< `string`, `string` \>

Flat query parameters

## Source

[rest/utils/query-to-params.ts:15](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/utils/query-to-params.ts#L15)
