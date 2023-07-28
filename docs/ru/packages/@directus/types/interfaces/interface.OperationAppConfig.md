---
editLink: false
---

# Interface: OperationAppConfig

## Properties

### description

> `optional` **description**: `string`

#### Source

[types/src/operations.ts:22](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/operations.ts#L22)

---

### icon

> **icon**: `string`

#### Source

[types/src/operations.ts:21](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/operations.ts#L21)

---

### id

> **id**: `string`

#### Source

[types/src/operations.ts:19](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/operations.ts#L19)

---

### name

> **name**: `string`

#### Source

[types/src/operations.ts:20](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/operations.ts#L20)

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
> (`options`) => \{`children`: `null` \|
> `{ name?: string; children?: ...[] | null; collection?: string; field?: string; type?: "string" | "boolean" | "alias" | "unknown" | "bigInteger" | "date" | "dateTime" | "decimal" | "float" | "integer" | ... 14 more ... | "geometry.MultiPolygon"; schema?: { ...; } | null; meta?: { ...; } | null; }`[];
> `collection`: `string`; `field`: `string`; `meta`: `null` \|
> `{ id?: number; collection?: string; field?: string; group?: string | null; hidden?: boolean; interface?: string | null; display?: string | null; options?: { [x: string]: any; } | null; display_options?: { ...; } | null; ... 10 more ...; system?: true; }`;
> `name`: `string`; `schema`: `null` \|
> `{ name?: string; table?: string; data_type?: string; default_value?: string | number | boolean | null; max_length?: number | null; numeric_precision?: number | null; numeric_scale?: number | null; ... 10 more ...; foreign_key_schema?: string | null; }`;
> `type`: `"string"` \| `"boolean"` \| `"alias"` \| `"unknown"` \| `"bigInteger"` \| `"date"` \| `"dateTime"` \|
> `"decimal"` \| `"float"` \| `"integer"` \| `"json"` \| `"text"` \| `"time"` \| `"timestamp"` \| `"binary"` \| `"uuid"`
> \| `"hash"` \| `"csv"` \| `"geometry"` \| `"geometry.Point"` \| `"geometry.LineString"` \| `"geometry.Polygon"` \|
> `"geometry.MultiPoint"` \| `"geometry.MultiLineString"` \| `"geometry.MultiPolygon"`;}[]

#### Source

[types/src/operations.ts:31](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/operations.ts#L31)

---

### overview

> **overview**: `null` \| `ComponentOptions` \| (`options`, `__namedParameters`) => \{`copyable`: `boolean`; `label`:
> `string`; `text`: `string`;}[]

#### Source

[types/src/operations.ts:24](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/operations.ts#L24)
