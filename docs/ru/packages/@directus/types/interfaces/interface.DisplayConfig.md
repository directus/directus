---
editLink: false
---

# Interface: DisplayConfig

## Properties

### component

> **component**: `Component`

#### Source

[types/src/displays.ts:21](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/displays.ts#L21)

---

### description

> `optional` **description**: `string`

#### Source

[types/src/displays.ts:19](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/displays.ts#L19)

---

### fields

> `optional` **fields**: `string`[] \| [`DisplayFieldsFunction`](../type-aliases/type-alias.DisplayFieldsFunction.md)

#### Source

[types/src/displays.ts:37](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/displays.ts#L37)

---

### handler

> `optional` **handler**: (`value`, `options`, `ctx`) => `null` \| `string`

#### Parameters

| Parameter               | Type                          |
| :---------------------- | :---------------------------- |
| `value`                 | `any`                         |
| `options`               | `Record`\< `string`, `any` \> |
| `ctx`                   | `object`                      |
| `ctx.collection`?       | `string`                      |
| `ctx.field`?            | [`Field`](interface.Field.md) |
| `ctx.interfaceOptions`? | `Record`\< `string`, `any` \> |

#### Returns

`null` \| `string`

#### Source

[types/src/displays.ts:22](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/displays.ts#L22)

---

### icon

> **icon**: `string`

#### Source

[types/src/displays.ts:18](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/displays.ts#L18)

---

### id

> **id**: `string`

#### Source

[types/src/displays.ts:16](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/displays.ts#L16)

---

### localTypes

> `optional` **localTypes**: _readonly_ (`"standard"` \| `"file"` \| `"files"` \| `"m2o"` \| `"o2m"` \| `"m2m"` \|
> `"m2a"` \| `"presentation"` \| `"translations"` \| `"group"`)[]

#### Source

[types/src/displays.ts:36](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/displays.ts#L36)

---

### name

> **name**: `string`

#### Source

[types/src/displays.ts:17](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/displays.ts#L17)

---

### options

> **options**: `null` \| \{`children`: `null` \|
> `{ name?: string; children?: ...[] | null; collection?: string; field?: string; type?: "string" | "boolean" | "alias" | "unknown" | "bigInteger" | "date" | "dateTime" | "decimal" | "float" | "integer" | ... 14 more ... | "geometry.MultiPolygon"; schema?: { ...; } | null; meta?: { ...; } | null; }`[];
> `collection`: `string`; `field`: `string`; `meta`: `null` \|
> `{ id?: number; collection?: string; field?: string; group?: string | null; hidden?: boolean; interface?: string | null; display?: string | null; options?: { [x: string]: any; } | null; display_options?: { ...; } | null; ... 10 more ...; system?: true; }`;
> `name`: `string`; `schema`: `null` \|
> `{ name?: string; table?: string; data_type?: string; default_value?: string | number | boolean | null; max_length?: number | null; numeric_precision?: number | null; numeric_scale?: number | null; ... 10 more ...; foreign_key_schema?: string | null; }`;
> `type`: `"string"` \| `"boolean"` \| `"alias"` \| `"unknown"` \| `"bigInteger"` \| `"date"` \| `"dateTime"` \|
> `"decimal"` \| `"float"` \| `"integer"` \| `"json"` \| `"text"` \| `"time"` \| `"timestamp"` \| `"binary"` \| `"uuid"`
> \| `"hash"` \| `"csv"` \| `"geometry"` \| `"geometry.Point"` \| `"geometry.LineString"` \| `"geometry.Polygon"` \|
> `"geometry.MultiPoint"` \| `"geometry.MultiLineString"` \| `"geometry.MultiPolygon"`;}[] \| `ComponentOptions` \|
> \{`advanced`: \{`children`: `null` \|
> `{ name?: string; children?: ...[] | null; collection?: string; field?: string; type?: "string" | "boolean" | "alias" | "unknown" | "bigInteger" | "date" | "dateTime" | "decimal" | "float" | "integer" | ... 14 more ... | "geometry.MultiPolygon"; schema?: { ...; } | null; meta?: { ...; } | null; }`[];
> `collection`: `string`; `field`: `string`; `meta`: `null` \|
> `{ id?: number; collection?: string; field?: string; group?: string | null; hidden?: boolean; interface?: string | null; display?: string | null; options?: { [x: string]: any; } | null; display_options?: { ...; } | null; ... 10 more ...; system?: true; }`;
> `name`: `string`; `schema`: `null` \|
> `{ name?: string; table?: string; data_type?: string; default_value?: string | number | boolean | null; max_length?: number | null; numeric_precision?: number | null; numeric_scale?: number | null; ... 10 more ...; foreign_key_schema?: string | null; }`;
> `type`: `"string"` \| `"boolean"` \| `"alias"` \| `"unknown"` \| `"bigInteger"` \| `"date"` \| `"dateTime"` \|
> `"decimal"` \| `"float"` \| `"integer"` \| `"json"` \| `"text"` \| `"time"` \| `"timestamp"` \| `"binary"` \| `"uuid"`
> \| `"hash"` \| `"csv"` \| `"geometry"` \| `"geometry.Point"` \| `"geometry.LineString"` \| `"geometry.Polygon"` \|
> `"geometry.MultiPoint"` \| `"geometry.MultiLineString"` \| `"geometry.MultiPolygon"`;}[]; `standard`: \{`children`:
> `null` \|
> `{ name?: string; children?: ...[] | null; collection?: string; field?: string; type?: "string" | "boolean" | "alias" | "unknown" | "bigInteger" | "date" | "dateTime" | "decimal" | "float" | "integer" | ... 14 more ... | "geometry.MultiPolygon"; schema?: { ...; } | null; meta?: { ...; } | null; }`[];
> `collection`: `string`; `field`: `string`; `meta`: `null` \|
> `{ id?: number; collection?: string; field?: string; group?: string | null; hidden?: boolean; interface?: string | null; display?: string | null; options?: { [x: string]: any; } | null; display_options?: { ...; } | null; ... 10 more ...; system?: true; }`;
> `name`: `string`; `schema`: `null` \|
> `{ name?: string; table?: string; data_type?: string; default_value?: string | number | boolean | null; max_length?: number | null; numeric_precision?: number | null; numeric_scale?: number | null; ... 10 more ...; foreign_key_schema?: string | null; }`;
> `type`: `"string"` \| `"boolean"` \| `"alias"` \| `"unknown"` \| `"bigInteger"` \| `"date"` \| `"dateTime"` \|
> `"decimal"` \| `"float"` \| `"integer"` \| `"json"` \| `"text"` \| `"time"` \| `"timestamp"` \| `"binary"` \| `"uuid"`
> \| `"hash"` \| `"csv"` \| `"geometry"` \| `"geometry.Point"` \| `"geometry.LineString"` \| `"geometry.Polygon"` \|
> `"geometry.MultiPoint"` \| `"geometry.MultiLineString"` \| `"geometry.MultiPolygon"`;}[];} \| (`ctx`) => \{`children`:
> `null` \|
> `{ name?: string; children?: ...[] | null; collection?: string; field?: string; type?: "string" | "boolean" | "alias" | "unknown" | "bigInteger" | "date" | "dateTime" | "decimal" | "float" | "integer" | ... 14 more ... | "geometry.MultiPolygon"; schema?: { ...; } | null; meta?: { ...; } | null; }`[];
> `collection`: `string`; `field`: `string`; `meta`: `null` \|
> `{ id?: number; collection?: string; field?: string; group?: string | null; hidden?: boolean; interface?: string | null; display?: string | null; options?: { [x: string]: any; } | null; display_options?: { ...; } | null; ... 10 more ...; system?: true; }`;
> `name`: `string`; `schema`: `null` \|
> `{ name?: string; table?: string; data_type?: string; default_value?: string | number | boolean | null; max_length?: number | null; numeric_precision?: number | null; numeric_scale?: number | null; ... 10 more ...; foreign_key_schema?: string | null; }`;
> `type`: `"string"` \| `"boolean"` \| `"alias"` \| `"unknown"` \| `"bigInteger"` \| `"date"` \| `"dateTime"` \|
> `"decimal"` \| `"float"` \| `"integer"` \| `"json"` \| `"text"` \| `"time"` \| `"timestamp"` \| `"binary"` \| `"uuid"`
> \| `"hash"` \| `"csv"` \| `"geometry"` \| `"geometry.Point"` \| `"geometry.LineString"` \| `"geometry.Polygon"` \|
> `"geometry.MultiPoint"` \| `"geometry.MultiLineString"` \| `"geometry.MultiPolygon"`;}[] \| \{`advanced`:
> \{`children`: `null` \|
> `{ name?: string; children?: ...[] | null; collection?: string; field?: string; type?: "string" | "boolean" | "alias" | "unknown" | "bigInteger" | "date" | "dateTime" | "decimal" | "float" | "integer" | ... 14 more ... | "geometry.MultiPolygon"; schema?: { ...; } | null; meta?: { ...; } | null; }`[];
> `collection`: `string`; `field`: `string`; `meta`: `null` \|
> `{ id?: number; collection?: string; field?: string; group?: string | null; hidden?: boolean; interface?: string | null; display?: string | null; options?: { [x: string]: any; } | null; display_options?: { ...; } | null; ... 10 more ...; system?: true; }`;
> `name`: `string`; `schema`: `null` \|
> `{ name?: string; table?: string; data_type?: string; default_value?: string | number | boolean | null; max_length?: number | null; numeric_precision?: number | null; numeric_scale?: number | null; ... 10 more ...; foreign_key_schema?: string | null; }`;
> `type`: `"string"` \| `"boolean"` \| `"alias"` \| `"unknown"` \| `"bigInteger"` \| `"date"` \| `"dateTime"` \|
> `"decimal"` \| `"float"` \| `"integer"` \| `"json"` \| `"text"` \| `"time"` \| `"timestamp"` \| `"binary"` \| `"uuid"`
> \| `"hash"` \| `"csv"` \| `"geometry"` \| `"geometry.Point"` \| `"geometry.LineString"` \| `"geometry.Polygon"` \|
> `"geometry.MultiPoint"` \| `"geometry.MultiLineString"` \| `"geometry.MultiPolygon"`;}[]; `standard`: \{`children`:
> `null` \|
> `{ name?: string; children?: ...[] | null; collection?: string; field?: string; type?: "string" | "boolean" | "alias" | "unknown" | "bigInteger" | "date" | "dateTime" | "decimal" | "float" | "integer" | ... 14 more ... | "geometry.MultiPolygon"; schema?: { ...; } | null; meta?: { ...; } | null; }`[];
> `collection`: `string`; `field`: `string`; `meta`: `null` \|
> `{ id?: number; collection?: string; field?: string; group?: string | null; hidden?: boolean; interface?: string | null; display?: string | null; options?: { [x: string]: any; } | null; display_options?: { ...; } | null; ... 10 more ...; system?: true; }`;
> `name`: `string`; `schema`: `null` \|
> `{ name?: string; table?: string; data_type?: string; default_value?: string | number | boolean | null; max_length?: number | null; numeric_precision?: number | null; numeric_scale?: number | null; ... 10 more ...; foreign_key_schema?: string | null; }`;
> `type`: `"string"` \| `"boolean"` \| `"alias"` \| `"unknown"` \| `"bigInteger"` \| `"date"` \| `"dateTime"` \|
> `"decimal"` \| `"float"` \| `"integer"` \| `"json"` \| `"text"` \| `"time"` \| `"timestamp"` \| `"binary"` \| `"uuid"`
> \| `"hash"` \| `"csv"` \| `"geometry"` \| `"geometry.Point"` \| `"geometry.LineString"` \| `"geometry.Polygon"` \|
> `"geometry.MultiPoint"` \| `"geometry.MultiLineString"` \| `"geometry.MultiPolygon"`;}[];}

#### Source

[types/src/displays.ts:27](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/displays.ts#L27)

---

### types

> **types**: _readonly_ (`"string"` \| `"boolean"` \| `"alias"` \| `"unknown"` \| `"bigInteger"` \| `"date"` \|
> `"dateTime"` \| `"decimal"` \| `"float"` \| `"integer"` \| `"json"` \| `"text"` \| `"time"` \| `"timestamp"` \|
> `"binary"` \| `"uuid"` \| `"hash"` \| `"csv"` \| `"geometry"` \| `"geometry.Point"` \| `"geometry.LineString"` \|
> `"geometry.Polygon"` \| `"geometry.MultiPoint"` \| `"geometry.MultiLineString"` \| `"geometry.MultiPolygon"`)[]

#### Source

[types/src/displays.ts:35](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/displays.ts#L35)
