---
editLink: false
---

# Function: deleteComment()

> **deleteComment**\<`Schema`\>(`key`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Deletes a comment.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type                                                                                                 |
| :-------- | :--------------------------------------------------------------------------------------------------- |
| `key`     | [`DirectusActivity`](../../schema/type-aliases/type-alias.DirectusActivity.md)\< `Schema` \>[`"id"`] |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Nothing

## Source

[rest/commands/delete/activity.ts:10](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/delete/activity.ts#L10)
