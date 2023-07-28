---
editLink: false
---

# Type alias: ExtensionManifest

> **ExtensionManifest**: `object`

## Type declaration

### dependencies

`optional` **dependencies**: `Record`\< `string`, `string` \>

---

### directus:extension

**directus:extension**: \{`hidden`: `boolean`; `host`: `string`;} & \{`path`: `string`; `source`: `string`; `type`:
`"interface"` \| `"display"` \| `"layout"` \| `"module"` \| `"panel"` \| `"hook"` \| `"endpoint"`;} \| \{`hidden`:
`boolean`; `host`: `string`;} & \{`path`: \{`api`: `string`; `app`: `string`;}; `source`: \{`api`: `string`; `app`:
`string`;}; `type`: `"operation"`;} \| \{`hidden`: `boolean`; `host`: `string`;} & \{`entries`: (\{`name`: `string`;
`source`: `string`; `type`: `"interface"` \| `"display"` \| `"layout"` \| `"module"` \| `"panel"` \| `"hook"` \|
`"endpoint"`;} \| \{`name`: `string`; `source`: \{`api`: `string`; `app`: `string`;}; `type`: `"operation"`;})[];
`path`: \{`api`: `string`; `app`: `string`;}; `type`: `"bundle"`;}

---

### name

**name**: `string`

---

### type

`optional` **type**: `"module"` \| `"commonjs"`

---

### version

**version**: `string`

## Source

[types/src/extensions.ts:76](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/extensions.ts#L76)
