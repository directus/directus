---
editLink: false
---

# Interface: Field

## Extends

- [`FieldRaw`](interface.FieldRaw.md)

## Properties

### children

> `optional` **children**: `null` \| [`Field`](interface.Field.md)[]

#### Source

[types/src/fields.ts:56](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/fields.ts#L56)

---

### collection

> **collection**: `string`

#### Source

[types/src/fields.ts:47](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/fields.ts#L47)

#### Inherited from

[`FieldRaw`](interface.FieldRaw.md).[`collection`](interface.FieldRaw.md#collection)

---

### field

> **field**: `string`

#### Source

[types/src/fields.ts:48](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/fields.ts#L48)

#### Inherited from

[`FieldRaw`](interface.FieldRaw.md).[`field`](interface.FieldRaw.md#field)

---

### meta

> **meta**: `null` \| [`FieldMeta`](../type-aliases/type-alias.FieldMeta.md)

#### Source

[types/src/fields.ts:51](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/fields.ts#L51)

#### Inherited from

[`FieldRaw`](interface.FieldRaw.md).[`meta`](interface.FieldRaw.md#meta)

---

### name

> **name**: `string`

#### Source

[types/src/fields.ts:55](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/fields.ts#L55)

---

### schema

> **schema**: `null` \| `Column`

#### Source

[types/src/fields.ts:50](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/fields.ts#L50)

#### Inherited from

[`FieldRaw`](interface.FieldRaw.md).[`schema`](interface.FieldRaw.md#schema)

---

### type

> **type**: `"string"` \| `"boolean"` \| `"alias"` \| `"unknown"` \| `"bigInteger"` \| `"date"` \| `"dateTime"` \|
> `"decimal"` \| `"float"` \| `"integer"` \| `"json"` \| `"text"` \| `"time"` \| `"timestamp"` \| `"binary"` \| `"uuid"`
> \| `"hash"` \| `"csv"` \| `"geometry"` \| `"geometry.Point"` \| `"geometry.LineString"` \| `"geometry.Polygon"` \|
> `"geometry.MultiPoint"` \| `"geometry.MultiLineString"` \| `"geometry.MultiPolygon"`

#### Source

[types/src/fields.ts:49](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/fields.ts#L49)

#### Inherited from

[`FieldRaw`](interface.FieldRaw.md).[`type`](interface.FieldRaw.md#type)
