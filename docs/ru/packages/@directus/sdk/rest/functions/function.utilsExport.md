---
editLink: false
---

# Function: utilsExport()

> **utilsExport**\<`Schema`, `TQuery`, `Collection`\>( `collection`, `format`, `query`, `file`):
> [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Export a larger data set to a file in the File Library

## Type parameters

| Parameter                                                                                                       |
| :-------------------------------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                                                     |
| `TQuery` _extends_ [`Query`](../../types-1/interfaces/interface.Query.md)\< `Schema`, `Schema`[`Collection`] \> |
| `Collection` _extends_ `string` \| `number` \| `symbol`                                                         |

## Parameters

| Parameter    | Type                                                                                                |
| :----------- | :-------------------------------------------------------------------------------------------------- |
| `collection` | `Collection`                                                                                        |
| `format`     | [`FileFormat`](../type-aliases/type-alias.FileFormat.md)                                            |
| `query`      | `TQuery`                                                                                            |
| `file`       | `Partial`\< [`DirectusFile`](../../schema/type-aliases/type-alias.DirectusFile.md)\< `Schema` \> \> |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Nothing

## Source

[rest/commands/utils/export.ts:12](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/utils/export.ts#L12)
