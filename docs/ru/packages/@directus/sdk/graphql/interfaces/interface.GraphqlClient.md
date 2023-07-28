---
editLink: false
---

# Interface: GraphqlClient`<_Schema>`

## Type parameters

| Parameter                    |
| :--------------------------- |
| `_Schema` _extends_ `object` |

## Methods

### query()

> **query**\<`Output`\>( `query`, `variables`?, `scope`?): `Promise`\< `Output` \>

#### Type parameters

| Parameter                   | Default                       |
| :-------------------------- | :---------------------------- |
| `Output` _extends_ `object` | `Record`\< `string`, `any` \> |

#### Parameters

| Parameter    | Type                              |
| :----------- | :-------------------------------- |
| `query`      | `string`                          |
| `variables`? | `Record`\< `string`, `unknown` \> |
| `scope`?     | `"items"` \| `"system"`           |

#### Returns

`Promise`\< `Output` \>

#### Source

[graphql/types.ts:2](https://github.com/directus/directus/blob/7789a6c53/sdk/src/graphql/types.ts#L2)
