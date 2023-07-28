---
editLink: false
---

# Type alias: ExtensionOptionsContext

> **ExtensionOptionsContext**: `object`

## Type declaration

### autoGenerateJunctionRelation

**autoGenerateJunctionRelation**: `boolean`

---

### collection

**collection**: `string` \| `undefined`

---

### collections

**collections**: `object`

#### Type declaration

> ##### collections.junction
>
> **junction**: [`DeepPartial`](type-alias.DeepPartial.md)\< [`Collection`](../interfaces/interface.Collection.md) &
> \{`fields`: [`DeepPartial`](type-alias.DeepPartial.md)\< [`Field`](../interfaces/interface.Field.md) \>[];} \> \|
> `undefined`
>
> ##### collections.related
>
> **related**: [`DeepPartial`](type-alias.DeepPartial.md)\< [`Collection`](../interfaces/interface.Collection.md) &
> \{`fields`: [`DeepPartial`](type-alias.DeepPartial.md)\< [`Field`](../interfaces/interface.Field.md) \>[];} \> \|
> `undefined`

---

### editing

**editing**: `string`

---

### field

**field**: [`DeepPartial`](type-alias.DeepPartial.md)\< [`Field`](../interfaces/interface.Field.md) \>

---

### fields

**fields**: `object`

#### Type declaration

> ##### fields.corresponding
>
> **corresponding**: [`DeepPartial`](type-alias.DeepPartial.md)\< [`Field`](../interfaces/interface.Field.md) \> \|
> `undefined`
>
> ##### fields.junctionCurrent
>
> **junctionCurrent**: [`DeepPartial`](type-alias.DeepPartial.md)\< [`Field`](../interfaces/interface.Field.md) \> \|
> `undefined`
>
> ##### fields.junctionRelated
>
> **junctionRelated**: [`DeepPartial`](type-alias.DeepPartial.md)\< [`Field`](../interfaces/interface.Field.md) \> \|
> `undefined`
>
> ##### fields.sort
>
> **sort**: [`DeepPartial`](type-alias.DeepPartial.md)\< [`Field`](../interfaces/interface.Field.md) \> \| `undefined`

---

### items

**items**: `Record`\< `string`, `Record`\< `string`, `any` \>[] \>

---

### localType

**localType**: _typeof_ `LOCAL_TYPES`[`number`]

---

### relations

**relations**: `object`

#### Type declaration

> ##### relations.m2a
>
> `optional` **m2a**: [`DeepPartial`](type-alias.DeepPartial.md)\< [`Relation`](type-alias.Relation.md) \>
>
> ##### relations.m2o
>
> **m2o**: [`DeepPartial`](type-alias.DeepPartial.md)\< [`Relation`](type-alias.Relation.md) \> \| `undefined`
>
> ##### relations.o2m
>
> **o2m**: [`DeepPartial`](type-alias.DeepPartial.md)\< [`Relation`](type-alias.Relation.md) \> \| `undefined`

---

### saving

**saving**: `boolean`

## Source

[types/src/extensions.ts:95](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/extensions.ts#L95)
