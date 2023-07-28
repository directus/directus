---
editLink: false
---

# Function: deleteTranslation()

> **deleteTranslation**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema`
> \>

Delete an existing translation.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                                       |
| :-------- | :--------------------------------------------------------------------------------------------------------- |
| `key`     | [`DirectusTranslation`](../../schema/type-aliases/type-alias.DirectusTranslation.md)\< `Schema` \>[`"id"`] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/translations.ts:24](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/translations.ts#L24)
