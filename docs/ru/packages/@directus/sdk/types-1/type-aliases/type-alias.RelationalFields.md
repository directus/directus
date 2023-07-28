---
editLink: false
---

# Type alias: RelationalFields`<Schema, Item>`

> **RelationalFields**: \<`Schema`, `Item`\>
> `{ [Key in keyof Item]: Extract<Item[Key], ItemType<Schema>> extends never ? never : Key }`[*keyof* `Item`]

Return string keys of all Relational fields in the given schema Item

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |
| `Item`                      |

## Source

[types/schema.ts:52](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/schema.ts#L52)
