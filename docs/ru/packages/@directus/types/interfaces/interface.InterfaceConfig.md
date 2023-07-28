---
editLink: false
---

# Interface: InterfaceConfig

## Properties

### autoKey

> `optional` **autoKey**: `boolean`

#### Source

[types/src/interfaces.ts:28](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L28)

---

### component

> **component**: `Component`

#### Source

[types/src/interfaces.ts:12](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L12)

---

### description

> `optional` **description**: `string`

#### Source

[types/src/interfaces.ts:10](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L10)

---

### group

> `optional` **group**: `"standard"` \| `"presentation"` \| `"group"` \| `"selection"` \| `"relational"` \| `"other"`

#### Source

[types/src/interfaces.ts:23](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L23)

---

### hideLabel

> `optional` **hideLabel**: `boolean`

#### Source

[types/src/interfaces.ts:26](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L26)

---

### hideLoader

> `optional` **hideLoader**: `boolean`

#### Source

[types/src/interfaces.ts:27](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L27)

---

### icon

> **icon**: `string`

#### Source

[types/src/interfaces.ts:9](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L9)

---

### id

> **id**: `string`

#### Source

[types/src/interfaces.ts:7](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L7)

---

### localTypes

> `optional` **localTypes**: _readonly_ (`"standard"` \| `"file"` \| `"files"` \| `"m2o"` \| `"o2m"` \| `"m2m"` \|
> `"m2a"` \| `"presentation"` \| `"translations"` \| `"group"`)[]

#### Source

[types/src/interfaces.ts:22](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L22)

---

### name

> **name**: `string`

#### Source

[types/src/interfaces.ts:8](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L8)

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
> `"geometry.MultiPoint"` \| `"geometry.MultiLineString"` \| `"geometry.MultiPolygon"`;}[];} \| `ComponentOptions` \|
> (`ctx`) => \{`children`: `null` \|
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

[types/src/interfaces.ts:13](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L13)

---

### order

> `optional` **order**: `number`

#### Source

[types/src/interfaces.ts:24](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L24)

---

### preview

> `optional` **preview**: `string`

#### Source

[types/src/interfaces.ts:31](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L31)

---

### recommendedDisplays

> `optional` **recommendedDisplays**: `string`[]

#### Source

[types/src/interfaces.ts:30](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L30)

---

### relational

> `optional` **relational**: `boolean`

#### Source

[types/src/interfaces.ts:25](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L25)

---

### system

> `optional` **system**: `boolean`

#### Source

[types/src/interfaces.ts:29](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L29)

---

### types

> **types**: _readonly_ (`"string"` \| `"boolean"` \| `"alias"` \| `"unknown"` \| `"bigInteger"` \| `"date"` \|
> `"dateTime"` \| `"decimal"` \| `"float"` \| `"integer"` \| `"json"` \| `"text"` \| `"time"` \| `"timestamp"` \|
> `"binary"` \| `"uuid"` \| `"hash"` \| `"csv"` \| `"geometry"` \| `"geometry.Point"` \| `"geometry.LineString"` \|
> `"geometry.Polygon"` \| `"geometry.MultiPoint"` \| `"geometry.MultiLineString"` \| `"geometry.MultiPolygon"`)[]

#### Source

[types/src/interfaces.ts:21](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/interfaces.ts#L21)
