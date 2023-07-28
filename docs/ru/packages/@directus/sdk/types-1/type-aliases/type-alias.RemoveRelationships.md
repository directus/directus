---
editLink: false
---

# Type alias: RemoveRelationships`<Schema, Item>`

> **RemoveRelationships**: \<`Schema`, `Item`\> `{ [Key in keyof Item]: Exclude<Item[Key], ItemType<Schema>> }`

Remove the related Item types from relational m2o/a2o fields

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |
| `Item`                      |

## Source

[types/schema.ts:59](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/schema.ts#L59)
