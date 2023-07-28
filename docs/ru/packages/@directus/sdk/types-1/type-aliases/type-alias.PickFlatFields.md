---
editLink: false
---

# Type alias: PickFlatFields`<Schema, Item, Fields>`

> **PickFlatFields**: \<`Schema`, `Item`, `Fields`\> `Extract`\< `Fields`, _keyof_ `Item` \> _extends_ `never` ? `never`
> : `Pick`\< [`RemoveRelationships`](type-alias.RemoveRelationships.md)\< `Schema`, `Item` \>, `Extract`\< `Fields`,
> _keyof_ `Item` \> \>

Extract the required fields from an item

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |
| `Item`                      |
| `Fields`                    |

## Source

[types/fields.ts:103](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/fields.ts#L103)
