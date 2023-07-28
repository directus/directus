---
editLink: false
---

# Function: isDirectusError()

> **isDirectusError**\<`T`\>(`err`, `code`?): `err is DirectusError<T>`

Check whether or not a passed thing is a valid Directus error

## Type parameters

| Parameter | Default   |
| :-------- | :-------- |
| `T`       | `unknown` |

## Parameters

| Parameter | Type      | Description |
| :-------- | :-------- | :---------- |
| `err`     | `unknown` | Any input   |
| `code`?   | `string`  | -           |

## Returns

`err is DirectusError<T>`

## Source

[packages/errors/src/is-directus-error.ts:8](https://github.com/directus/directus/blob/7789a6c53/packages/errors/src/is-directus-error.ts#L8)
