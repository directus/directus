---
editLink: false
---

# Type alias: ItemType`<Schema>`

> **ItemType**: \<`Schema`\> `Schema`[*keyof* `Schema`] \|
> `{ [K in keyof Schema]: Schema[K] extends any[] ? Schema[K][number] : never }`[*keyof* `Schema`]

Get all available top level Item types from a given Schema

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Source

[types/schema.ts:7](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/schema.ts#L7)
