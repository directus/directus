---
editLink: false
---

# Type alias: NestedPartial`<Item>`

> **NestedPartial**: \<`Item`\>
> `{ [Key in keyof Item]?: Item[Key] extends object ? NestedPartial<Item[Key]> : Item[Key] }`

## Type parameters

| Parameter                 |
| :------------------------ |
| `Item` _extends_ `object` |

## Source

[types/utils.ts:37](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/utils.ts#L37)
