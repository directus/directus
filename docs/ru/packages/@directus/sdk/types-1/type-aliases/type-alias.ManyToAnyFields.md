---
editLink: false
---

# Type alias: ManyToAnyFields`<Schema, Item>`

> **ManyToAnyFields**: \<`Schema`, `Item`\> [`ExtractItem`](type-alias.ExtractItem.md)\< `Schema`, `Item` \> _extends_
> infer TItem ? `TItem` _extends_ `object` ? `"collection"` _extends_ _keyof_ `TItem` ? `"item"` _extends_ _keyof_
> `TItem` ? [`WrapQueryFields`](type-alias.WrapQueryFields.md)\< `TItem`, `Omit`\<
> [`QueryFieldsRelational`](type-alias.QueryFieldsRelational.md)\< `Schema`, [`UnpackList`](type-alias.UnpackList.md)\<
> `Item` \> \>, `"item"` \> & \{`item`:
> `{ [Collection in keyof Schema as Collection extends TItem["collection"] ? Collection : never]?: QueryFields<Schema, Schema[Collection]> }`;}
> \> : `never` : `never` : `never` : `never`

Deal with many-to-any relational fields

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |
| `Item`                      |

## Source

[types/fields.ts:34](https://github.com/directus/directus/blob/7789a6c53/sdk/src/types/fields.ts#L34)
