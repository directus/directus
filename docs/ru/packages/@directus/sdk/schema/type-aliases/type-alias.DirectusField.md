---
editLink: false
---

# Type alias: DirectusField`<Schema>`

> **DirectusField**: \<`Schema`\> `object`

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
`"directus_fields"`, \{`collection`: `string`; `conditions`:
[`FieldMetaConditionType`](type-alias.FieldMetaConditionType.md)[] \| `null`; `display`: `string` \| `null`;
`display_options`: `Record`\< `string`, `any` \> \| `null`; `field`: `string`; `group`: `string` \| `null`; `hidden`:
`boolean`; `id`: `number`; `interface`: `string` \| `null`; `note`: `string` \| `null`; `options`: `Record`\< `string`,
`any` \> \| `null`; `readonly`: `boolean`; `required`: `boolean`; `sort`: `number` \| `null`; `special`: `string`[] \|
`null`; `translations`: [`FieldMetaTranslationType`](type-alias.FieldMetaTranslationType.md)[] \| `null`; `validation`:
`Record`\< `string`, `any` \> \| `null`; `validation_message`: `string` \| `null`; `width`: `string` \| `null`;} \>

---

### schema

**schema**: `object`

#### Type declaration

> ##### schema.comment
>
> **comment**: `string` \| `null`
>
> ##### schema.data_type
>
> **data_type**: `string`
>
> ##### schema.default_value
>
> **default_value**: `any` \| `null`
>
> ##### schema.foreign_key_column
>
> **foreign_key_column**: `string` \| `null`
>
> ##### schema.foreign_key_schema
>
> **foreign_key_schema**: `string` \| `null`
>
> ##### schema.foreign_key_table
>
> **foreign_key_table**: `string` \| `null`
>
> ##### schema.generation_expression
>
> **generation_expression**: `unknown` \| `null`
>
> ##### schema.has_auto_increment
>
> **has_auto_increment**: `boolean`
>
> ##### schema.is_generated
>
> **is_generated**: `boolean`
>
> ##### schema.is_nullable
>
> **is_nullable**: `boolean`
>
> ##### schema.is_primary_key
>
> **is_primary_key**: `boolean`
>
> ##### schema.is_unique
>
> **is_unique**: `boolean`
>
> ##### schema.max_length
>
> **max_length**: `number` \| `null`
>
> ##### schema.name
>
> **name**: `string`
>
> ##### schema.numeric_precision
>
> **numeric_precision**: `number` \| `null`
>
> ##### schema.numeric_scale
>
> **numeric_scale**: `number` \| `null`
>
> ##### schema.schema
>
> **schema**: `string`
>
> ##### schema.table
>
> **table**: `string`

---

### type

**type**: `string`

## Source

[schema/field.ts:3](https://github.com/directus/directus/blob/7789a6c53/sdk/src/schema/field.ts#L3)
