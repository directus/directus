---
editLink: false
---

# Function: inviteShare()

> **inviteShare**\<`Schema`\>(`share`, `emails`): [`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`,
> `Schema` \>

Sends an email to the provided email addresses with a link to the share.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter | Type       | Description                                         |
| :-------- | :--------- | :-------------------------------------------------- |
| `share`   | `string`   | Primary key of the share you're inviting people to. |
| `emails`  | `string`[] | Array of email strings to send the share link to.   |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< `void`, `Schema` \>

Nothing

## Source

[rest/commands/utils/shares.ts:38](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/utils/shares.ts#L38)
