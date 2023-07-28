---
editLink: false
---

# Function: readGraphqlSdl()

> **readGraphqlSdl**\<`Schema`\>(`scope` = `'item'`): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> `string`, `Schema` \>

Retrieve the OpenAPI spec for the current project.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                   | Default value |
| :-------- | :--------------------- | :------------ |
| `scope`   | `"system"` \| `"item"` | `'item'`      |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `string`, `Schema` \>

Object conforming to the OpenAPI Specification

## Source

[rest/commands/server/graphql.ts:8](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/server/graphql.ts#L8)
