---
editLink: false
---

# Type alias: FilterHandler`<T>`

> **FilterHandler**: \<`T`\> (`payload`, `meta`, `context`) => `T` \| `Promise`\< `T` \>

## Type parameters

| Parameter | Default   |
| :-------- | :-------- |
| `T`       | `unknown` |

## Parameters

| Parameter | Type                                         |
| :-------- | :------------------------------------------- |
| `payload` | `T`                                          |
| `meta`    | `Record`\< `string`, `any` \>                |
| `context` | [`EventContext`](type-alias.EventContext.md) |

## Returns

`T` \| `Promise`\< `T` \>

## Source

[types/src/events.ts:11](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/events.ts#L11)
