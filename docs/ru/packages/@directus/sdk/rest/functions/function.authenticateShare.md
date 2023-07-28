---
editLink: false
---

# Function: authenticateShare()

> **authenticateShare**\<`Schema`\>(`share`, `password`): [`RestCommand`](../interfaces/interface.RestCommand.md)\<
> \{`access_token`: `string`; `expires`: `number`; `refresh_token`: `string`;}, `Schema` \>

Shares work by publicly giving you an access/refresh token combination (as you would get with the regular /auth/login
endpoints). These tokens are limited to a permissions set that only allows access to the item that was shared, and any
relationally linked items that that associated role has access to. This means that all regular endpoints can be used
with the credentials set returned by this endpoint.

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Parameters

| Parameter  | Type     | Description                                                                                                                                                                                                                                                                                                                                                                                                           |
| :--------- | :------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `share`    | `string` | Shares work by publicly giving you an access/refresh token combination (as you would get with the regular /auth/login endpoints). These tokens are limited to a permissions set that only allows access to the item that was shared, and any relationally linked items that that associated role has access to. This means that all regular endpoints can be used with the credentials set returned by this endpoint. |
| `password` | `string` | Password for the share, if one is configured.                                                                                                                                                                                                                                                                                                                                                                         |

## Returns

[`RestCommand`](../interfaces/interface.RestCommand.md)\< \{`access_token`: `string`; `expires`: `number`;
`refresh_token`: `string`;}, `Schema` \>

Authentication Credentials

## Source

[rest/commands/utils/shares.ts:12](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/utils/shares.ts#L12)
