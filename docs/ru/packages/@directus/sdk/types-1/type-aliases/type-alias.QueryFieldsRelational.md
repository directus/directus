---
editLink: false
---

# Type alias: QueryFieldsRelational`<Schema, Item>`

> **QueryFieldsRelational**: \<`Schema`, `Item`\>
> `{ [Key in RelationalFields<Schema, Item>]?: Extract<Item[Key], ItemType<Schema>> extends infer RelatedCollection ? RelatedCollection extends any[] ? HasManyToAnyRelation<RelatedCollection> extends never ? QueryFields<Schema, RelatedCollection> : ManyToAnyFields<Schema, RelatedCollection> : QueryFields<Schema, RelatedCollection> : never }`

Object of nested relational fields in a given Item with it's own fields available for selection

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |
| `Item`                      |

## Source

[types/fields.ts:21](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/fields.ts#L21)
