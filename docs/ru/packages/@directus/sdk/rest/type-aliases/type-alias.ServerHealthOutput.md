---
editLink: false
---

# Type alias: ServerHealthOutput

> **ServerHealthOutput**: `object`

## Type declaration

### checks

`optional` **checks**: `object`

#### Index signature

\[`name`: `string`\]: `Record`\< `string`, `any` \>[]

---

### releaseId

`optional` **releaseId**: `string`

---

### serviceId

`optional` **serviceId**: `string`

---

### status

**status**: `"ok"` \| `"warn"` \| `"error"`

## Source

[rest/commands/server/health.ts:3](https://github.com/directus/directus/blob/7789a6c53/sdk/src/rest/commands/server/health.ts#L3)
