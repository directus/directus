---
editLink: false
---

# Type alias: DirectusRelation`<Schema>`

> **DirectusRelation**: \<`Schema`\> `object`

## Type parameters

| Parameter                   |
| :-------------------------- |
| `Schema` _extends_ `object` |

## Type declaration

### collection

**collection**: `string`

---

### field

**field**: `string`

---

### meta

**meta**: [`MergeCoreCollection`](../../types-1/type-aliases/type-alias.MergeCoreCollection.md)\< `Schema`,
`"directus_relations"`, \{`id`: `number`; `junction_field`: `string` \| `null`; `many_collection`: `string` \| `null`;
`many_field`: `string` \| `null`; `one_allowed_collections`: `string` \| `null`; `one_collection`: `string` \| `null`;
`one_collection_field`: `string` \| `null`; `one_deselect_action`: `string`; `one_field`: `string` \| `null`;
`sort_field`: `string` \| `null`; `system`: `boolean` \| `null`;} \>

---

### related_collection

**related_collection**: `string`

---

### schema

**schema**: `object`

#### Type declaration

> ##### schema.column
>
> **column**: `string`
>
> ##### schema.constraint_name
>
> **constraint_name**: `string`
>
> ##### schema.foreign_key_column
>
> **foreign_key_column**: `string`
>
> ##### schema.foreign_key_schema
>
> **foreign_key_schema**: `string`
>
> ##### schema.foreign_key_table
>
> **foreign_key_table**: `string`
>
> ##### schema.on_delete
>
> **on_delete**: `string`
>
> ##### schema.on_update
>
> **on_update**: `string`
>
> ##### schema.table
>
> **table**: `string`

## Source

[schema/relation.ts:3](https://github.com/directus/directus/blob/7789a6c53/sdk/src/schema/relation.ts#L3)
