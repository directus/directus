---
editLink: false
---

# Interface: PanelConfig

## Properties

### component

> **component**: `Component`

#### Source

[types/src/panels.ts:16](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/panels.ts#L16)

---

### description

> `optional` **description**: `string`

#### Source

[types/src/panels.ts:12](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/panels.ts#L12)

---

### icon

> **icon**: `string`

#### Source

[types/src/panels.ts:11](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/panels.ts#L11)

---

### id

> **id**: `string`

#### Source

[types/src/panels.ts:9](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/panels.ts#L9)

---

### minHeight

> **minHeight**: `number`

#### Source

[types/src/panels.ts:26](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/panels.ts#L26)

---

### minWidth

> **minWidth**: `number`

#### Source

[types/src/panels.ts:25](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/panels.ts#L25)

---

### name

> **name**: `string`

#### Source

[types/src/panels.ts:10](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/panels.ts#L10)

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

[types/src/panels.ts:17](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/panels.ts#L17)

---

### query

> `optional` **query**: (`options`) => `undefined` \| [`PanelQuery`](../type-aliases/type-alias.PanelQuery.md) \|
> [`PanelQuery`](../type-aliases/type-alias.PanelQuery.md)[]

#### Parameters

| Parameter | Type                          |
| :-------- | :---------------------------- |
| `options` | `Record`\< `string`, `any` \> |

#### Returns

`undefined` \| [`PanelQuery`](../type-aliases/type-alias.PanelQuery.md) \|
[`PanelQuery`](../type-aliases/type-alias.PanelQuery.md)[]

#### Source

[types/src/panels.ts:14](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/panels.ts#L14)

---

### skipUndefinedKeys

> `optional` **skipUndefinedKeys**: `string`[]

#### Source

[types/src/panels.ts:27](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/panels.ts#L27)

---

### variable

> `optional` **variable**: `true`

#### Source

[types/src/panels.ts:15](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/panels.ts#L15)
