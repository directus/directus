---
editLink: false
---

# Type alias: Merge`<A, B, TypeA, TypeB>`

> **Merge**: \<`A`, `B`, `TypeA`, `TypeB`\> \{ [K in keyof TypeA \| keyof TypeB]: K extends keyof TypeA & keyof TypeB ?
> TypeA[K] \| TypeB[K] : K extends keyof TypeB ? TypeB[K] : K extends keyof TypeA ? TypeA[K] : never }

Merge two object types with never guard

## Type parameters

| Parameter | Default                                                   |
| :-------- | :-------------------------------------------------------- |
| `A`       | -                                                         |
| `B`       | -                                                         |
| `TypeA`   | [`NeverToUnknown`](type-alias.NeverToUnknown.md)\< `A` \> |
| `TypeB`   | [`NeverToUnknown`](type-alias.NeverToUnknown.md)\< `B` \> |

## Source

[types/utils.ts:14](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/utils.ts#L14)
