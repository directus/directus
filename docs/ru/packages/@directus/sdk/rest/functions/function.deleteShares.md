---
editLink: false
---

# Function: deleteShares()

> **deleteShares**\<`Schema`\>(`keys`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Delete multiple existing shares.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                             |
| :-------- | :----------------------------------------------------------------------------------------------- |
| `keys`    | [`DirectusShare`](../../schema/type-aliases/type-alias.DirectusShare.md)\< `Schema` \>[`"id"`][] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/shares.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/shares.ts#L10)
