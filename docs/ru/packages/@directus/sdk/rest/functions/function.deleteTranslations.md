---
editLink: false
---

# Function: deleteTranslations()

> **deleteTranslations**\<`Schema`\>(`keys`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema`
> \>

Delete multiple existing translations.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                                         |
| :-------- | :----------------------------------------------------------------------------------------------------------- |
| `keys`    | [`DirectusTranslation`](../../schema/type-aliases/type-alias.DirectusTranslation.md)\< `Schema` \>[`"id"`][] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

## Source

[rest/commands/delete/translations.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/translations.ts#L10)
