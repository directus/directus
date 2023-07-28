---
editLink: false
---

# Type alias: GetCollection`<Schema, CollectionName>`

> **GetCollection**: \<`Schema`, `CollectionName`\> `CollectionName` _extends_ _keyof_
> [`CoreSchema`](../../schema/interfaces/interface.CoreSchema.md)\< `Schema` \> ?
> [`CoreSchema`](../../schema/interfaces/interface.CoreSchema.md)\< `Schema` \>[`CollectionName`] : `CollectionName`
> _extends_ _keyof_ `Schema` ? `Schema`[`CollectionName`] : `never`

Helper to extract a collection with fallback to defaults

## Type parameters

| Parameter                                                                                 |
| :---------------------------------------------------------------------------------------- |
| `Schema` _extends_ `object`                                                               |
| `CollectionName` _extends_ [`AllCollections`](type-alias.AllCollections.md)\< `Schema` \> |

## Source

[types/schema.ts:99](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/schema.ts#L99)
