---
editLink: false
---

# Type alias: ApiExtensionContext

> **ApiExtensionContext**: `object`

## Type declaration

### database

**database**: `Knex`

---

### env

**env**: `Record`\< `string`, `any` \>

---

### getSchema

**getSchema**: (`options`?) => `Promise`\< [`SchemaOverview`](type-alias.SchemaOverview.md) \>

#### Parameters

| Parameter                 | Type                                             |
| :------------------------ | :----------------------------------------------- |
| `options`?                | `object`                                         |
| `options.accountability`? | [`Accountability`](type-alias.Accountability.md) |
| `options.database`?       | `Knex`                                           |

#### Returns

`Promise`\< [`SchemaOverview`](type-alias.SchemaOverview.md) \>

---

### logger

**logger**: `Logger`

---

### services

**services**: `any`

## Source

[types/src/extensions.ts:87](https://github.com/directus/directus/blob/7789a6c53/packages/types/src/extensions.ts#L87)
