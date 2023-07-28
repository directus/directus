---
editLink: false
---

# Function: createError()

> **createError**\<`Extensions`\>( `code`, `message`, `status` = `500`):
> [`DirectusErrorConstructor`](../interfaces/interface.DirectusErrorConstructor.md)\< `Extensions` \>

## Type parameters

| Parameter    | Default |
| :----------- | :------ |
| `Extensions` | `void`  |

## Parameters

| Parameter | Type                                   | Default value |
| :-------- | :------------------------------------- | :------------ |
| `code`    | `string`                               | `undefined`   |
| `message` | `string` \| (`extensions`) => `string` | `undefined`   |
| `status`  | `number`                               | `500`         |

## Returns

[`DirectusErrorConstructor`](../interfaces/interface.DirectusErrorConstructor.md)\< `Extensions` \>

## Source

[packages/errors/src/create-error.ts:12](https://github.com/directus/directus/blob/7789a6c53/packages/errors/src/create-error.ts#L12)
