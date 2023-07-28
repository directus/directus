---
editLink: false
---

# Type alias: PrimitiveFields`<Schema, Item>`

> **PrimitiveFields**: \<`Schema`, `Item`\>
> `{ [Key in keyof Item]: Extract<Item[Key], ItemType<Schema>> extends never ? Key : never }`[*keyof* `Item`]

Return string keys of all Primitive fields in the given schema Item

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |
| `Item`                      |

## Source

[types/schema.ts:45](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/schema.ts#L45)
