---
editLink: false
---

# Type alias: Mutable`<T>`

> **Mutable**: \<`T`\> `T` _extends_ `object` ? `{ -readonly [K in keyof T]: Mutable<T[K]> }` : `T`

Makes types mutable

## Type parameters

| Parameter |
| :-------- |
| `T`       |

## Source

[types/utils.ts:4](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/utils.ts#L4)
